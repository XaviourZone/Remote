package com.xaviourzone.universalremote.data

import android.content.Context
import com.xaviourzone.universalremote.ir.AcFan
import com.xaviourzone.universalremote.ir.AcMode
import com.xaviourzone.universalremote.ir.AcState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.UUID

/**
 * A remote saved on the phone. [kind] is "ir" (a set of buttons, stored as Flipper .ir text so it
 * works offline) or "ac" (a smart AC protocol whose full state is generated on each press).
 */
data class SavedRemote(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val category: String,
    val brand: String,
    val kind: String,
    val irText: String = "",
    val sourcePath: String = "",
    val acProtocol: String = "",
    val acState: AcState = AcState(),
    val created: Long = System.currentTimeMillis(),
)

class MyRemotesStore(context: Context) {
    private val file = File(context.filesDir, "my_remotes.json")
    private val _remotes = MutableStateFlow(load())
    val remotes: StateFlow<List<SavedRemote>> = _remotes

    fun get(id: String): SavedRemote? = _remotes.value.firstOrNull { it.id == id }

    @Synchronized
    fun upsert(r: SavedRemote) {
        val list = _remotes.value.toMutableList()
        val i = list.indexOfFirst { it.id == r.id }
        if (i >= 0) list[i] = r else list.add(r)
        _remotes.value = list
        save(list)
    }

    @Synchronized
    fun delete(id: String) {
        val list = _remotes.value.filterNot { it.id == id }
        _remotes.value = list
        save(list)
    }

    @Synchronized
    fun move(id: String, delta: Int) {
        val list = _remotes.value.toMutableList()
        val i = list.indexOfFirst { it.id == id }
        val j = i + delta
        if (i < 0 || j !in list.indices) return
        val tmp = list[i]; list[i] = list[j]; list[j] = tmp
        _remotes.value = list
        save(list)
    }

    private fun load(): List<SavedRemote> {
        if (!file.exists()) return emptyList()
        return try {
            val arr = JSONArray(file.readText())
            (0 until arr.length()).map { fromJson(arr.getJSONObject(it)) }
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun save(list: List<SavedRemote>) {
        val arr = JSONArray()
        list.forEach { arr.put(toJson(it)) }
        val tmp = File(file.parentFile, file.name + ".tmp")
        tmp.writeText(arr.toString())
        if (!tmp.renameTo(file)) { file.writeText(arr.toString()); tmp.delete() }
    }

    private fun toJson(r: SavedRemote) = JSONObject().apply {
        put("id", r.id); put("name", r.name); put("category", r.category); put("brand", r.brand)
        put("kind", r.kind); put("irText", r.irText); put("sourcePath", r.sourcePath)
        put("acProtocol", r.acProtocol); put("created", r.created)
        put("ac", JSONObject().apply {
            put("power", r.acState.power); put("mode", r.acState.mode.name); put("temp", r.acState.temp)
            put("fan", r.acState.fan.name); put("swing", r.acState.swing); put("turbo", r.acState.turbo)
        })
    }

    private fun fromJson(o: JSONObject): SavedRemote {
        val ac = o.optJSONObject("ac")
        val state = if (ac == null) AcState() else AcState(
            power = ac.optBoolean("power", true),
            mode = runCatching { AcMode.valueOf(ac.optString("mode")) }.getOrDefault(AcMode.COOL),
            temp = ac.optInt("temp", 24),
            fan = runCatching { AcFan.valueOf(ac.optString("fan")) }.getOrDefault(AcFan.AUTO),
            swing = ac.optBoolean("swing", false),
            turbo = ac.optBoolean("turbo", false),
        )
        return SavedRemote(
            id = o.optString("id", UUID.randomUUID().toString()), name = o.optString("name"),
            category = o.optString("category"), brand = o.optString("brand"), kind = o.optString("kind", "ir"),
            irText = o.optString("irText"), sourcePath = o.optString("sourcePath"),
            acProtocol = o.optString("acProtocol"), acState = state, created = o.optLong("created"),
        )
    }
}
