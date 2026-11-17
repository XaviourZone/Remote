@file:OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)

package com.xaviourzone.universalremote.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.xaviourzone.universalremote.BuildConfig
import com.xaviourzone.universalremote.data.SavedRemote
import com.xaviourzone.universalremote.ir.FlipperIr
import com.xaviourzone.universalremote.ir.FlipperProtocols
import com.xaviourzone.universalremote.ir.IrButton
import com.xaviourzone.universalremote.ir.IrSignal
import com.xaviourzone.universalremote.ir.Pronto
import com.xaviourzone.universalremote.ir.RawText
import kotlinx.coroutines.launch

/** Enter a code by hand: protocol + address/command, Pronto hex, or raw timings. */
@Composable
fun CodeLabScreen(vm: AppViewModel, targetRemoteId: String?) {
    var mode by remember { mutableStateOf("Protocol") }
    var protocol by remember { mutableStateOf("NEC") }
    var address by remember { mutableStateOf("") }
    var command by remember { mutableStateOf("") }
    var pronto by remember { mutableStateOf("") }
    var raw by remember { mutableStateOf("") }
    var freq by remember { mutableStateOf("38000") }
    var name by remember { mutableStateOf("Power") }
    var choosing by remember { mutableStateOf(false) }
    var newRemoteName by remember { mutableStateOf<String?>(null) }

    fun build(): IrSignal? = when (mode) {
        "Protocol" -> {
            val a = address.trim().removePrefix("0x").toLongOrNull(16)
            val c = command.trim().removePrefix("0x").toLongOrNull(16)
            if (a == null || c == null) null else IrSignal.Parsed(protocol, a, c)
        }
        "Pronto" -> Pronto.parse(pronto)
        else -> RawText.parse(raw, freq.toIntOrNull() ?: 38000)
    }

    fun addTo(r: SavedRemote) {
        val sig = build() ?: return
        val list = FlipperIr.parse(r.irText) + IrButton(name.ifBlank { "Button" }, sig)
        vm.store.upsert(r.copy(irText = FlipperIr.serialize(list, "Universal Remote: ${r.name}")))
        vm.toast("Added “$name” to ${r.name}")
    }

    Scaffold(topBar = { BackTopBar("Enter a code", vm::back) }) { inner ->
        Column(Modifier.fillMaxSize().padding(inner).padding(16.dp).verticalScroll(rememberScrollState())) {
            Text("Found a code online? Enter it here, test it, then add it to a remote.", style = MaterialTheme.typography.bodyMedium)
            Spacer(Modifier.height(12.dp))
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                for (m in listOf("Protocol", "Pronto", "Raw")) FilterChip(selected = mode == m, onClick = { mode = m }, label = { Text(m) })
            }
            Spacer(Modifier.height(12.dp))
            when (mode) {
                "Protocol" -> {
                    Text("Protocol", style = MaterialTheme.typography.labelLarge)
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        FlipperProtocols.supported.forEach { p -> FilterChip(selected = protocol == p, onClick = { protocol = p }, label = { Text(p) }) }
                    }
                    OutlinedTextField(address, { address = it }, Modifier.fillMaxWidth(), label = { Text("Address (hex), e.g. 04") }, singleLine = true)
                    OutlinedTextField(command, { command = it }, Modifier.fillMaxWidth(), label = { Text("Command (hex), e.g. 08") }, singleLine = true)
                }
                "Pronto" -> OutlinedTextField(
                    pronto, { pronto = it }, Modifier.fillMaxWidth().heightIn(min = 140.dp),
                    label = { Text("Pronto hex (0000 006D 0022 0002 …)") },
                )
                else -> {
                    OutlinedTextField(freq, { freq = it }, Modifier.fillMaxWidth(), label = { Text("Carrier frequency (Hz)") }, singleLine = true)
                    OutlinedTextField(
                        raw, { raw = it }, Modifier.fillMaxWidth().heightIn(min = 140.dp),
                        label = { Text("Raw timings in µs (9000 4500 560 560 …)") },
                    )
                }
            }
            OutlinedTextField(name, { name = it }, Modifier.fillMaxWidth(), label = { Text("Button name") }, singleLine = true)
            Spacer(Modifier.height(16.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Button(onClick = {
                    val s = build()
                    if (s == null) vm.toast("The code isn't valid") else vm.send(s)
                }, Modifier.weight(1f)) { Text("Send test") }
                OutlinedButton(onClick = {
                    if (build() == null) { vm.toast("The code isn't valid"); return@OutlinedButton }
                    val target = targetRemoteId?.let { vm.store.get(it) }
                    if (target != null) { addTo(target); vm.back() } else choosing = true
                }, Modifier.weight(1f)) { Text("Add to remote") }
            }
        }
    }

    if (choosing) {
        val remotes = vm.store.remotes.value.filter { it.kind == "ir" }
        AlertDialog(
            onDismissRequest = { choosing = false },
            title = { Text("Add to which remote?") },
            text = {
                Column {
                    remotes.forEach { r ->
                        ListItem(headlineContent = { Text(r.name) }, modifier = Modifier.clickable { choosing = false; addTo(r) })
                    }
                    TextButton(onClick = { choosing = false; newRemoteName = "My remote" }) { Text("+ New remote") }
                }
            },
            confirmButton = { TextButton(onClick = { choosing = false }) { Text("Cancel") } },
        )
    }
    newRemoteName?.let { initial ->
        TextInputDialog("New remote name", initial, onDismiss = { newRemoteName = null }) { n ->
            newRemoteName = null
            val r = SavedRemote(name = n, category = "Miscellaneous", brand = "", kind = "ir", irText = FlipperIr.serialize(emptyList()))
            vm.store.upsert(r)
            addTo(vm.store.get(r.id) ?: r)
        }
    }
}

@Composable
fun SettingsScreen(vm: AppViewModel) {
    val scope = rememberCoroutineScope()
    val indexState by vm.index.collectAsState()
    var libCount by remember { mutableIntStateOf(vm.repo.libraryCount()) }
    var downloading by remember { mutableStateOf<String?>(null) }

    Scaffold(topBar = { BackTopBar("Settings", vm::back) }) { inner ->
        Column(Modifier.fillMaxSize().padding(inner).padding(16.dp).verticalScroll(rememberScrollState())) {
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text("IR blaster", style = MaterialTheme.typography.titleMedium)
                    Text(if (vm.ir.available) "Detected ✓" else "Not detected on this phone")
                    if (vm.ir.frequencyRanges.isNotEmpty()) {
                        Text(
                            "Supported carrier: " + vm.ir.frequencyRanges.joinToString { "${it.first / 1000}–${it.last / 1000} kHz" },
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                }
            }
            Spacer(Modifier.height(12.dp))
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text("Online remote library", style = MaterialTheme.typography.titleMedium)
                    when (val s = indexState) {
                        is IndexState.Ready -> {
                            Text("${s.index.entries.size} remotes from ${s.index.source}")
                            Text("Updated ${s.index.generated.take(10)} · ${vm.repo.lastIndexSource}", style = MaterialTheme.typography.bodySmall)
                        }
                        is IndexState.Loading -> Text("Loading…")
                        is IndexState.Failed -> Text(s.message)
                    }
                    TextButton(onClick = { vm.refreshIndex(true) }) { Text("Check for new remotes now") }
                }
            }
            Spacer(Modifier.height(12.dp))
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text("Offline mode", style = MaterialTheme.typography.titleMedium)
                    Text(
                        if (libCount > 0) "$libCount remote files saved on this phone. Auto-detect works without internet."
                        else "Remotes are downloaded when you open them. Download everything (about 30 MB) to use auto-detect without internet.",
                    )
                    Spacer(Modifier.height(8.dp))
                    if (downloading != null) {
                        Row { CircularProgressIndicator(Modifier.height(24.dp)); Text("  $downloading") }
                    } else {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(onClick = {
                                val idx = vm.indexOrNull() ?: return@Button
                                downloading = "Starting download…"
                                scope.launch {
                                    try {
                                        val n = vm.repo.downloadLibrary(idx) { downloading = it }
                                        vm.toast("Saved $n remotes for offline use")
                                    } catch (e: Exception) {
                                        vm.toast("Download failed: ${e.message}")
                                    }
                                    libCount = vm.repo.libraryCount()
                                    downloading = null
                                }
                            }) { Text(if (libCount > 0) "Update offline library" else "Download all remotes") }
                            if (libCount > 0) OutlinedButton(onClick = { vm.repo.deleteLibrary(); libCount = 0 }) { Text("Delete") }
                        }
                    }
                    TextButton(onClick = { vm.repo.clearCache(); vm.toast("Cache cleared") }) { Text("Clear downloaded cache") }
                }
            }
            Spacer(Modifier.height(12.dp))
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text("About", style = MaterialTheme.typography.titleMedium)
                    Text("Universal Remote ${BuildConfig.VERSION_NAME}")
                    HorizontalDivider(Modifier.padding(vertical = 8.dp))
                    Text(
                        "Remote codes: Flipper-IRDB community database (github.com/Lucaslhm/Flipper-IRDB).\n" +
                            "AC protocols ported from IRremoteESP8266 (LGPL-2.1).\n" +
                            "Source code: github.com/XaviourZone/Remote",
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
            }
        }
    }
}
