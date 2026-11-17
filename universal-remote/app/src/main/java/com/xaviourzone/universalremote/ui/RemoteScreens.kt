@file:OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)

package com.xaviourzone.universalremote.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.xaviourzone.universalremote.data.IndexEntry
import com.xaviourzone.universalremote.data.SavedRemote
import com.xaviourzone.universalremote.ir.AcAction
import com.xaviourzone.universalremote.ir.AcFan
import com.xaviourzone.universalremote.ir.AcMode
import com.xaviourzone.universalremote.ir.AcProtocols
import com.xaviourzone.universalremote.ir.AcState
import com.xaviourzone.universalremote.ir.FlipperIr
import com.xaviourzone.universalremote.ir.IrButton

@Composable
fun RemoteScreen(vm: AppViewModel, id: String) {
    val remotes by vm.store.remotes.collectAsState()
    val r = remotes.firstOrNull { it.id == id }
    if (r == null) {
        LaunchedEffect(Unit) { vm.back() }
        return
    }
    if (r.kind == "ac") AcRemoteScreen(vm, r) else IrRemoteScreen(vm, r)
}

@Composable
private fun IrRemoteScreen(vm: AppViewModel, r: SavedRemote) {
    val buttons = remember(r.irText) { FlipperIr.parse(r.irText) }
    var edit by remember { mutableStateOf(false) }
    var menuFor by remember { mutableStateOf<Int?>(null) }
    var renameIdx by remember { mutableStateOf<Int?>(null) }

    fun saveButtons(list: List<IrButton>) {
        vm.store.upsert(r.copy(irText = FlipperIr.serialize(list, "Universal Remote: ${r.name}")))
    }

    Scaffold(topBar = {
        BackTopBar(r.name, vm::back) {
            IconButton(onClick = { vm.go(Screen.CodeLab(r.id)) }) { Icon(Icons.Default.Add, "Add button") }
            IconButton(onClick = { edit = !edit }) { Icon(Icons.Default.Edit, "Edit buttons") }
        }
    }) { inner ->
        Column(Modifier.fillMaxSize().padding(inner).verticalScroll(rememberScrollState())) {
            if (edit) {
                Card(
                    Modifier.fillMaxWidth().padding(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.tertiaryContainer),
                ) {
                    Text(
                        "Edit mode: long-press any button in the grid (or tap below) to fix, rename or delete it.",
                        Modifier.padding(12.dp),
                    )
                }
                FlowRow(Modifier.padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    buttons.forEachIndexed { i, b ->
                        FilterChip(selected = false, onClick = { menuFor = i }, label = { Text(b.name) })
                    }
                }
                Spacer(Modifier.height(12.dp))
            }
            if (buttons.isEmpty()) CenterMessage("This remote has no buttons yet. Tap + to add one.")
            RemotePad(
                buttons,
                onSend = { b, _ -> vm.send(b.signal) },
                onLongPress = { _, i -> menuFor = i },
            )
        }
    }

    menuFor?.let { i ->
        val b = buttons.getOrNull(i)
        if (b == null) { menuFor = null; return@let }
        AlertDialog(
            onDismissRequest = { menuFor = null },
            title = { Text("Button “${b.name}”") },
            text = {
                Column {
                    TextButton(onClick = { menuFor = null; vm.go(Screen.FixButton(r.id, i)) }) { Text("This button doesn't work – find a working code") }
                    TextButton(onClick = { menuFor = null; renameIdx = i }) { Text("Rename") }
                    TextButton(onClick = {
                        menuFor = null
                        saveButtons(buttons.filterIndexed { j, _ -> j != i })
                    }) { Text("Delete", color = MaterialTheme.colorScheme.error) }
                }
            },
            confirmButton = { TextButton(onClick = { menuFor = null }) { Text("Close") } },
        )
    }
    renameIdx?.let { i ->
        TextInputDialog("Rename button", buttons[i].name, onDismiss = { renameIdx = null }) { name ->
            saveButtons(buttons.mapIndexed { j, b -> if (j == i) b.copy(name = name) else b })
            renameIdx = null
        }
    }
}

@Composable
private fun AcRemoteScreen(vm: AppViewModel, r: SavedRemote) {
    val protocol = AcProtocols.byId(r.acProtocol)
    var state by remember(r.id) { mutableStateOf(r.acState) }

    fun apply(newState: AcState, action: AcAction = AcAction.STATE) {
        val p = protocol ?: return
        val s = newState.copy(temp = newState.temp.coerceIn(p.minTemp, p.maxTemp))
        state = s
        vm.store.upsert(r.copy(acState = s))
        vm.send(p.encode(s, action))
    }

    Scaffold(topBar = { BackTopBar(r.name, vm::back) }) { inner ->
        if (protocol == null) {
            CenterMessage("Unknown AC protocol"); return@Scaffold
        }
        Column(
            Modifier.fillMaxSize().padding(inner).padding(20.dp).verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Card(
                Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = if (state.power) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant,
                ),
            ) {
                Column(Modifier.fillMaxWidth().padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(if (state.power) "ON · ${state.mode.label}" else "OFF", style = MaterialTheme.typography.titleMedium)
                    Text("${state.temp}°C", fontSize = 72.sp, fontWeight = FontWeight.Light)
                    Text("Fan ${state.fan.label}" + (if (state.swing) " · Swing" else "") + (if (state.turbo) " · Turbo" else ""))
                }
            }
            Spacer(Modifier.height(20.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                RemoteKey("−", size = 72.dp, fontSize = 32, repeatOnHold = false) { apply(state.copy(power = true, temp = state.temp - 1)) }
                Spacer(Modifier.width(24.dp))
                RemoteKey("⏻", size = 92.dp, fontSize = 36, container = if (state.power) PowerRed else MaterialTheme.colorScheme.primary, content = Color.White) {
                    apply(state.copy(power = !state.power))
                }
                Spacer(Modifier.width(24.dp))
                RemoteKey("+", size = 72.dp, fontSize = 32) { apply(state.copy(power = true, temp = state.temp + 1)) }
            }
            Spacer(Modifier.height(20.dp))
            Text("Mode", style = MaterialTheme.typography.titleSmall)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally)) {
                AcMode.entries.forEach { m ->
                    FilterChip(selected = state.mode == m, onClick = { apply(state.copy(power = true, mode = m)) }, label = { Text(m.label) })
                }
            }
            Spacer(Modifier.height(8.dp))
            Text("Fan speed", style = MaterialTheme.typography.titleSmall)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally)) {
                AcFan.entries.forEach { f ->
                    FilterChip(selected = state.fan == f, onClick = { apply(state.copy(power = true, fan = f)) }, label = { Text(f.label) })
                }
            }
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text("Swing", Modifier.weight(1f))
                Switch(checked = state.swing, onCheckedChange = { apply(state.copy(swing = it), AcAction.SWING) })
            }
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text("Turbo", Modifier.weight(1f))
                Switch(checked = state.turbo, onCheckedChange = { apply(state.copy(turbo = it)) })
            }
            Spacer(Modifier.height(16.dp))
            OutlinedButton(onClick = { apply(state) }, Modifier.fillMaxWidth()) { Text("Send current settings again") }
            Spacer(Modifier.height(8.dp))
            Text(
                "Protocol: ${protocol.title}. The phone can't read the AC's display, so if you also use the original remote, tap “Send current settings again” to sync.",
                style = MaterialTheme.typography.bodySmall, textAlign = TextAlign.Center,
            )
        }
    }
}

/** Finds a working code for one broken button by trying the same key from other remotes of the brand. */
@Composable
fun FixButtonScreen(vm: AppViewModel, remoteId: String, buttonIndex: Int) {
    val remote = vm.store.get(remoteId)
    val buttons = remember(remote) { remote?.let { FlipperIr.parse(it.irText) } ?: emptyList() }
    val target = buttons.getOrNull(buttonIndex)
    val index = vm.indexOrNull()
    val candidates: List<IndexEntry> = remember(index, remote) {
        if (index == null || remote == null) emptyList() else {
            val key = remote.brand.lowercase().replace(Regex("[^a-z0-9]"), "")
            val brandFiles = index.entries.filter { it.brandKey == key && it.path != remote.sourcePath }
            val sameCat = brandFiles.filter { it.category == remote.category }
            sameCat + (brandFiles - sameCat.toSet())
        }
    }
    var pos by remember { mutableIntStateOf(0) }
    var attempt by remember { mutableIntStateOf(0) }
    var found by remember { mutableStateOf<IrButton?>(null) }
    var searching by remember { mutableStateOf(true) }
    val tried = remember { HashSet<IrButton>() }

    fun matches(b: IrButton): Boolean {
        val t = target ?: return false
        val role = ButtonRoles.roleOf(t.name)
        if (role != null) return ButtonRoles.roleOf(b.name) == role
        val d = ButtonRoles.digitOf(t.name)
        if (d != null) return ButtonRoles.digitOf(b.name) == d
        return ButtonRoles.norm(b.name) == ButtonRoles.norm(t.name)
    }

    LaunchedEffect(attempt) {
        found = null; searching = true
        var p = pos
        while (p < candidates.size) {
            val list = runCatching { vm.loadButtons(candidates[p]) }.getOrNull()
            val hit = list?.firstOrNull { matches(it) && it.signal != target?.signal && it !in tried }
            if (hit != null) {
                pos = p
                found = hit; tried.add(hit); vm.send(hit.signal); break
            }
            p++
        }
        if (p >= candidates.size) pos = candidates.size
        searching = false
    }

    Scaffold(topBar = { BackTopBar("Fix “${target?.name ?: "button"}”", vm::back) }) { inner ->
        Column(
            Modifier.fillMaxSize().padding(inner).padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            if (remote == null || target == null) { CenterMessage("Button not found"); return@Column }
            Text("Trying the “${target.name}” key from other ${remote.brand} remotes.", textAlign = TextAlign.Center)
            Spacer(Modifier.height(20.dp))
            when {
                searching -> CircularProgressIndicator()
                found == null -> {
                    CenterMessage("No more alternatives for this key. You can add a code manually with the + button on the remote.")
                    Button(onClick = vm::back) { Text("Done") }
                }
                else -> {
                    val f = found!!
                    Text("Candidate from: ${candidates.getOrNull(pos)?.model ?: ""}", style = MaterialTheme.typography.bodySmall)
                    Spacer(Modifier.height(12.dp))
                    RemoteKey(target.name, size = 110.dp, container = MaterialTheme.colorScheme.primary, content = Color.White) { vm.send(f.signal) }
                    Spacer(Modifier.height(20.dp))
                    Text("Did it work?", style = MaterialTheme.typography.titleLarge)
                    Spacer(Modifier.height(12.dp))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedButton(onClick = { attempt++ }, Modifier.weight(1f).height(56.dp)) { Text("No, next") }
                        Button(onClick = {
                            val updated = buttons.mapIndexed { j, b -> if (j == buttonIndex) b.copy(signal = f.signal) else b }
                            vm.store.upsert(remote.copy(irText = FlipperIr.serialize(updated, "Universal Remote: ${remote.name}")))
                            vm.toast("Button updated")
                            vm.back()
                        }, Modifier.weight(1f).height(56.dp)) { Text("Yes, use it") }
                    }
                }
            }
        }
    }
}
