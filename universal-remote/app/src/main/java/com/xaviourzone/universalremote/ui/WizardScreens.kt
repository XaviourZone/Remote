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
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.xaviourzone.universalremote.data.Categories
import com.xaviourzone.universalremote.data.IndexEntry
import com.xaviourzone.universalremote.data.SavedRemote
import com.xaviourzone.universalremote.ir.AcAction
import com.xaviourzone.universalremote.ir.AcMode
import com.xaviourzone.universalremote.ir.AcProtocols
import com.xaviourzone.universalremote.ir.AcState
import com.xaviourzone.universalremote.ir.FlipperIr
import com.xaviourzone.universalremote.ir.IrButton
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Auto-detect: steps through candidate remotes, sending a test key (POWER by default)
 * from each one, and asks whether the device reacted.
 */
@Composable
fun WizardScreen(vm: AppViewModel, title: String, category: String?, candidates: List<IndexEntry>) {
    var pos by remember { mutableIntStateOf(0) }
    var buttons by remember { mutableStateOf<List<IrButton>?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var testKind by remember { mutableStateOf("Power") }
    var auto by remember { mutableStateOf(false) }
    var sentCount by remember { mutableIntStateOf(0) }
    val scope = rememberCoroutineScope()
    val entry = candidates.getOrNull(pos)

    fun testButton(list: List<IrButton>, e: IndexEntry): IrButton? = when (testKind) {
        "Vol+" -> list.firstOrNull { ButtonRoles.roleOf(it.name) == ButtonRoles.Role.VOL_UP }
        "Mute" -> list.firstOrNull { ButtonRoles.roleOf(it.name) == ButtonRoles.Role.MUTE }
        "Ch+" -> list.firstOrNull { ButtonRoles.roleOf(it.name) == ButtonRoles.Role.CH_UP }
        else -> AppViewModel.findTestButton(list, e.testButton)
    }

    fun sendCurrent() {
        val e = entry ?: return
        val list = buttons ?: return
        val b = testButton(list, e)
        if (b == null) { error = "This remote has no $testKind key"; return }
        vm.send(b.signal)
        sentCount++
    }

    LaunchedEffect(pos, testKind) {
        buttons = null; error = null
        val e = entry ?: return@LaunchedEffect
        try {
            val list = vm.loadButtons(e)
            buttons = list
            sendCurrent()
            // Prefetch the next two remotes so the scan stays fast.
            for (k in 1..2) candidates.getOrNull(pos + k)?.let { n -> scope.launch { runCatching { vm.loadButtons(n) } } }
        } catch (ex: Exception) {
            error = ex.message ?: "Download failed"
        }
    }

    LaunchedEffect(auto, pos, buttons, error) {
        if (!auto) return@LaunchedEffect
        if (buttons == null && error == null) return@LaunchedEffect
        delay(2600)
        if (pos < candidates.lastIndex) pos++ else auto = false
    }

    Scaffold(topBar = { BackTopBar("Auto-detect: $title", vm::back) }) { inner ->
        Column(
            Modifier.fillMaxSize().padding(inner).padding(20.dp).verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            if (candidates.isEmpty() || entry == null) {
                CenterMessage("No remotes to test.")
                return@Column
            }
            Text("Point the top of your phone at the device", style = MaterialTheme.typography.titleMedium, textAlign = TextAlign.Center)
            Spacer(Modifier.height(12.dp))
            LinearProgressIndicator(progress = { (pos + 1f) / candidates.size }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(6.dp))
            Text("Code ${pos + 1} of ${candidates.size}", style = MaterialTheme.typography.bodySmall)
            Spacer(Modifier.height(16.dp))
            val idx = vm.indexOrNull()
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text("${idx?.brandName(entry.brandKey) ?: entry.brandKey} · ${entry.model}", style = MaterialTheme.typography.titleMedium)
                    Text(Categories.label(entry.category), style = MaterialTheme.typography.bodySmall)
                }
            }
            Spacer(Modifier.height(16.dp))
            Text("Test with", style = MaterialTheme.typography.labelLarge)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                for (k in listOf("Power", "Vol+", "Mute", "Ch+")) {
                    FilterChip(selected = testKind == k, onClick = { testKind = k }, label = { Text(k) })
                }
            }
            Spacer(Modifier.height(16.dp))
            when {
                error != null -> Text(error!!, color = MaterialTheme.colorScheme.error, textAlign = TextAlign.Center)
                buttons == null -> CircularProgressIndicator()
                else -> {
                    val b = testButton(buttons!!, entry)
                    RemoteKey(
                        label = if (testKind == "Power") "⏻" else testKind, size = 110.dp, fontSize = 34,
                        container = PowerRed, content = androidx.compose.ui.graphics.Color.White,
                        enabled = b != null,
                    ) { sendCurrent() }
                    Spacer(Modifier.height(6.dp))
                    Text("Sends “${b?.name ?: "-"}” · tap to send again", style = MaterialTheme.typography.bodySmall)
                }
            }
            Spacer(Modifier.height(24.dp))
            Text("Did the device respond?", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedButton(
                    onClick = { auto = false; if (pos < candidates.lastIndex) pos++ },
                    modifier = Modifier.weight(1f).height(56.dp), enabled = pos < candidates.lastIndex,
                ) { Text("No, next ▶") }
                Button(
                    onClick = { auto = false; vm.replace(Screen.Preview(candidates, pos)) },
                    modifier = Modifier.weight(1f).height(56.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.tertiary),
                ) { Icon(Icons.Default.Check, null); Spacer(Modifier.width(6.dp)); Text("Yes, it works") }
            }
            Spacer(Modifier.height(8.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = { auto = false; if (pos > 0) pos-- }, enabled = pos > 0) { Text("◀ Previous") }
                Spacer(Modifier.weight(1f))
                Text("Auto-scan")
                Spacer(Modifier.width(8.dp))
                Switch(checked = auto, onCheckedChange = { auto = it })
            }
            if (auto) {
                Text(
                    "Sending a code every 2.6 s. Switch off auto-scan as soon as the device reacts, then use ◀ Previous if needed.",
                    style = MaterialTheme.typography.bodySmall, textAlign = TextAlign.Center,
                )
            }
        }
    }
}

@Composable
fun PreviewScreen(vm: AppViewModel, s: Screen.Preview) {
    val entry = s.siblings.getOrNull(s.position)
    var text by remember(s) { mutableStateOf(s.importedText) }
    var error by remember(s) { mutableStateOf<String?>(null) }
    var naming by remember { mutableStateOf(false) }
    LaunchedEffect(s) {
        if (text == null && entry != null) {
            try { text = vm.loadText(entry) } catch (e: Exception) { error = e.message ?: "Download failed" }
        }
    }
    val buttons = remember(text) { text?.let { FlipperIr.parse(it) } ?: emptyList() }
    val idx = vm.indexOrNull()
    val brand = entry?.let { idx?.brandName(it.brandKey) } ?: ""
    val title = if (entry != null) "$brand ${entry.model}" else s.importedTitle
    Scaffold(
        topBar = { BackTopBar(title, vm::back) },
        floatingActionButton = {
            if (buttons.isNotEmpty()) ExtendedFloatingActionButton(
                onClick = { naming = true }, icon = { Icon(Icons.Default.Check, null) }, text = { Text("Save remote") },
            )
        },
    ) { inner ->
        Column(Modifier.fillMaxSize().padding(inner).verticalScroll(rememberScrollState())) {
            if (entry != null && s.siblings.size > 1) {
                Row(Modifier.fillMaxWidth().padding(horizontal = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                    TextButton(enabled = s.position > 0, onClick = { vm.replace(s.copy(position = s.position - 1)) }) { Text("◀ Prev") }
                    Text("Model ${s.position + 1} of ${s.siblings.size}", Modifier.weight(1f), textAlign = TextAlign.Center, style = MaterialTheme.typography.bodySmall)
                    TextButton(enabled = s.position < s.siblings.lastIndex, onClick = { vm.replace(s.copy(position = s.position + 1)) }) { Text("Next ▶") }
                }
            }
            Card(
                Modifier.fillMaxWidth().padding(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
            ) {
                Text(
                    "Try a few buttons. If they work, tap “Save remote”. If not, try the next model.",
                    Modifier.padding(12.dp), style = MaterialTheme.typography.bodyMedium,
                )
            }
            when {
                error != null -> CenterMessage("Couldn't download this remote: $error")
                text == null -> Column(Modifier.fillMaxWidth().padding(40.dp), horizontalAlignment = Alignment.CenterHorizontally) { CircularProgressIndicator() }
                buttons.isEmpty() -> CenterMessage("This file has no usable buttons.")
                else -> RemotePad(buttons, onSend = { b, _ -> vm.send(b.signal) })
            }
        }
    }
    if (naming) {
        val suggested = if (entry != null) "$brand ${Categories.label(entry.category)}" else s.importedTitle
        TextInputDialog("Name this remote", suggested.trim(), onDismiss = { naming = false }) { name ->
            naming = false
            val saved = if (entry != null) vm.saveFromEntry(entry, text!!, name)
            else SavedRemote(name = name, category = "Miscellaneous", brand = "", kind = "ir", irText = text!!).also { vm.saveRemote(it) }
            vm.home()
            vm.go(Screen.Remote(saved.id))
            vm.toast("Saved “$name”")
        }
    }
}

/** Finds which AC protocol the user's air conditioner understands. */
@Composable
fun AcWizardScreen(vm: AppViewModel) {
    var pos by remember { mutableIntStateOf(0) }
    var naming by remember { mutableStateOf(false) }
    val protocols = AcProtocols.all
    val p = protocols[pos]
    val testState = AcState(power = true, mode = AcMode.COOL, temp = 24)
    Scaffold(topBar = { BackTopBar("Smart AC setup", vm::back) }) { inner ->
        Column(
            Modifier.fillMaxSize().padding(inner).padding(20.dp).verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                "Switch your AC OFF with its own remote, then point your phone at the AC and tap “Turn ON”.",
                textAlign = TextAlign.Center, style = MaterialTheme.typography.titleMedium,
            )
            Spacer(Modifier.height(16.dp))
            LinearProgressIndicator(progress = { (pos + 1f) / protocols.size }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(12.dp))
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text("Protocol ${pos + 1} of ${protocols.size}: ${p.title}", style = MaterialTheme.typography.titleMedium)
                    Text("Used by: ${p.brands}", style = MaterialTheme.typography.bodySmall)
                }
            }
            Spacer(Modifier.height(20.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                RemoteKey("Turn ON\nCool 24°", size = 110.dp, fontSize = 15, container = PowerRed, content = androidx.compose.ui.graphics.Color.White) {
                    vm.send(p.encode(testState, AcAction.STATE))
                }
                RemoteKey("Turn OFF", size = 110.dp, fontSize = 15) {
                    vm.send(p.encode(testState.copy(power = false), AcAction.STATE))
                }
            }
            Spacer(Modifier.height(24.dp))
            Text("Did the AC beep or respond?", style = MaterialTheme.typography.titleLarge)
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedButton(
                    onClick = { if (pos < protocols.lastIndex) pos++ else pos = 0 },
                    modifier = Modifier.weight(1f).height(56.dp),
                ) { Text(if (pos < protocols.lastIndex) "No, next ▶" else "Start over") }
                Button(onClick = { naming = true }, modifier = Modifier.weight(1f).height(56.dp)) { Text("Yes, it works") }
            }
            Spacer(Modifier.height(24.dp))
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
                Column(Modifier.padding(16.dp)) {
                    Text("None of them work?", style = MaterialTheme.typography.titleSmall)
                    Text("Your AC may use a code that is only in the online library. Browse AC brands and use auto-detect there.")
                    TextButton(onClick = { vm.go(Screen.Brands("ACs")) }) { Text("Browse AC remotes in the library") }
                }
            }
        }
    }
    if (naming) {
        TextInputDialog("Name this AC", "Bedroom AC", onDismiss = { naming = false }) { name ->
            naming = false
            val r = SavedRemote(name = name, category = "ACs", brand = p.title, kind = "ac", acProtocol = p.id, acState = testState)
            vm.saveRemote(r)
            vm.home()
            vm.go(Screen.Remote(r.id))
        }
    }
}
