package com.xaviourzone.universalremote.ui

import android.app.Application
import androidx.compose.runtime.mutableStateListOf
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.xaviourzone.universalremote.data.IndexEntry
import com.xaviourzone.universalremote.data.IrRepository
import com.xaviourzone.universalremote.data.MyRemotesStore
import com.xaviourzone.universalremote.data.RemoteIndex
import com.xaviourzone.universalremote.data.SavedRemote
import com.xaviourzone.universalremote.ir.FlipperIr
import com.xaviourzone.universalremote.ir.IrButton
import com.xaviourzone.universalremote.ir.IrPattern
import com.xaviourzone.universalremote.ir.IrSignal
import com.xaviourzone.universalremote.ir.IrTransmitter
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed interface Screen {
    data object Home : Screen
    data object AddRemote : Screen
    data class Brands(val category: String?) : Screen
    data class Models(val category: String?, val brandKey: String) : Screen
    /** Preview one database remote (with optional siblings for next/previous), or raw imported text. */
    data class Preview(
        val siblings: List<IndexEntry> = emptyList(),
        val position: Int = 0,
        val importedText: String? = null,
        val importedTitle: String = "Imported remote",
    ) : Screen
    data class Wizard(val title: String, val category: String?, val candidates: List<IndexEntry>) : Screen
    data class AcWizard(val brand: String) : Screen
    data class Remote(val id: String) : Screen
    data class Search(val initial: String = "") : Screen
    data class CodeLab(val targetRemoteId: String? = null) : Screen
    data class FixButton(val remoteId: String, val buttonIndex: Int) : Screen
    data object Settings : Screen
}

sealed interface IndexState {
    data object Loading : IndexState
    data class Ready(val index: RemoteIndex) : IndexState
    data class Failed(val message: String) : IndexState
}

class AppViewModel(app: Application) : AndroidViewModel(app) {
    val ir = IrTransmitter(app)
    val repo = IrRepository(app)
    val store = MyRemotesStore(app)

    private val _index = MutableStateFlow<IndexState>(IndexState.Loading)
    val index: StateFlow<IndexState> = _index

    val messages = MutableSharedFlow<String>(extraBufferCapacity = 8)
    val stack = mutableStateListOf<Screen>(Screen.Home)

    private val parsedCache = object : LinkedHashMap<String, List<IrButton>>(64, 0.75f, true) {
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<String, List<IrButton>>?) = size > 60
    }

    init { refreshIndex(false) }

    fun refreshIndex(force: Boolean) {
        if (force) _index.value = IndexState.Loading
        viewModelScope.launch {
            _index.value = try {
                IndexState.Ready(repo.loadIndex(force))
            } catch (e: Exception) {
                IndexState.Failed(e.message ?: "Could not load the remote library")
            }
        }
    }

    fun indexOrNull(): RemoteIndex? = (index.value as? IndexState.Ready)?.index

    fun go(s: Screen) { stack.add(s) }
    fun replace(s: Screen) { if (stack.size > 1) stack.removeAt(stack.lastIndex); stack.add(s) }
    fun back() { if (stack.size > 1) stack.removeAt(stack.lastIndex) }
    fun home() { while (stack.size > 1) stack.removeAt(stack.lastIndex) }

    fun toast(msg: String) { messages.tryEmit(msg) }

    suspend fun loadButtons(entry: IndexEntry): List<IrButton> {
        synchronized(parsedCache) { parsedCache[entry.path]?.let { return it } }
        val idx = indexOrNull() ?: throw IllegalStateException("Library not loaded yet")
        val text = repo.fetchRemote(idx, entry.path)
        val buttons = FlipperIr.parse(text)
        synchronized(parsedCache) { parsedCache[entry.path] = buttons }
        return buttons
    }

    suspend fun loadText(entry: IndexEntry): String {
        val idx = indexOrNull() ?: throw IllegalStateException("Library not loaded yet")
        return repo.fetchRemote(idx, entry.path)
    }

    fun send(signal: IrSignal) {
        if (!ir.send(signal)) toast(ir.lastError ?: "Could not send")
    }

    fun send(pattern: IrPattern) {
        if (!ir.send(pattern)) toast(ir.lastError ?: "Could not send")
    }

    fun saveRemote(r: SavedRemote) = store.upsert(r)

    fun saveFromEntry(entry: IndexEntry, text: String, name: String): SavedRemote {
        val idx = indexOrNull()
        val r = SavedRemote(
            name = name, category = entry.category, brand = idx?.brandName(entry.brandKey) ?: entry.brandKey,
            kind = "ir", irText = text, sourcePath = entry.path,
        )
        store.upsert(r)
        return r
    }

    companion object {
        private val POWER_HINTS = listOf(
            Regex("^power$"), Regex("^pwr$"), Regex("^power_?(on_?off|toggle)$"), Regex("^on_?off$"),
            Regex("power"), Regex("^off$"), Regex("^on$"), Regex("standby"),
        )

        fun findTestButton(buttons: List<IrButton>, hint: String?): IrButton? {
            if (buttons.isEmpty()) return null
            if (!hint.isNullOrBlank()) buttons.firstOrNull { it.name == hint }?.let { return it }
            for (rx in POWER_HINTS) buttons.firstOrNull { rx.containsMatchIn(it.name.lowercase()) }?.let { return it }
            return buttons.first()
        }
    }
}
