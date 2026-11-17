@file:OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)

package com.xaviourzone.universalremote.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.xaviourzone.universalremote.data.Categories
import com.xaviourzone.universalremote.data.IndexEntry
import com.xaviourzone.universalremote.data.RemoteIndex
import com.xaviourzone.universalremote.data.SavedRemote
import com.xaviourzone.universalremote.ir.FlipperIr
import kotlinx.coroutines.launch

@Composable
fun HomeScreen(vm: AppViewModel, padding: PaddingValues, onShare: (SavedRemote) -> Unit) {
    val remotes by vm.store.remotes.collectAsState()
    var renaming by remember { mutableStateOf<SavedRemote?>(null) }
    var deleting by remember { mutableStateOf<SavedRemote?>(null) }
    Scaffold(
        modifier = Modifier.padding(padding),
        topBar = {
            TopAppBar(
                title = { Text("Universal Remote", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = { vm.go(Screen.Search()) }) { Icon(Icons.Default.Search, "Search") }
                    IconButton(onClick = { vm.go(Screen.Settings) }) { Icon(Icons.Default.Settings, "Settings") }
                },
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { vm.go(Screen.AddRemote) },
                icon = { Icon(Icons.Default.Add, null) },
                text = { Text("Add remote") },
            )
        },
    ) { inner ->
        LazyColumn(Modifier.fillMaxSize().padding(inner), contentPadding = PaddingValues(16.dp, 8.dp, 16.dp, 96.dp)) {
            if (!vm.ir.available) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                        modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                    ) {
                        Text(
                            "No IR blaster detected on this phone. You can still browse remotes, but nothing can be sent.",
                            Modifier.padding(16.dp), color = MaterialTheme.colorScheme.onErrorContainer,
                        )
                    }
                }
            }
            if (remotes.isEmpty()) {
                item {
                    Column(Modifier.fillMaxWidth().padding(top = 24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("📡", fontSize = 56.sp)
                        Spacer(Modifier.height(12.dp))
                        Text("Control any IR device", style = MaterialTheme.typography.headlineSmall)
                        Spacer(Modifier.height(8.dp))
                        Text(
                            "Thousands of TV, AC, set-top box, fan, projector and audio remotes are downloaded from an online library when you need them.",
                            style = MaterialTheme.typography.bodyMedium,
                        )
                        Spacer(Modifier.height(20.dp))
                        Button(onClick = { vm.go(Screen.Brands("TVs")) }, Modifier.fillMaxWidth()) { Text("📺  Add a TV") }
                        Spacer(Modifier.height(8.dp))
                        Button(onClick = { vm.go(Screen.AcWizard("")) }, Modifier.fillMaxWidth()) { Text("❄️  Add an AC (smart control)") }
                        Spacer(Modifier.height(8.dp))
                        OutlinedButton(onClick = { vm.go(Screen.AddRemote) }, Modifier.fillMaxWidth()) { Text("Other devices") }
                    }
                }
            }
            items(remotes, key = { it.id }) { r ->
                var menu by remember { mutableStateOf(false) }
                Card(
                    Modifier.fillMaxWidth().padding(vertical = 5.dp).clickable { vm.go(Screen.Remote(r.id)) },
                ) {
                    Row(Modifier.padding(start = 16.dp, top = 12.dp, bottom = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(if (r.kind == "ac") "❄️" else Categories.emoji(r.category), fontSize = 30.sp)
                        Spacer(Modifier.width(14.dp))
                        Column(Modifier.weight(1f)) {
                            Text(r.name, style = MaterialTheme.typography.titleMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text(
                                listOf(r.brand, if (r.kind == "ac") "Smart AC" else Categories.label(r.category))
                                    .filter { it.isNotBlank() }.joinToString(" · "),
                                style = MaterialTheme.typography.bodySmall,
                            )
                        }
                        Box {
                            IconButton(onClick = { menu = true }) { Icon(Icons.Default.MoreVert, "Options") }
                            DropdownMenu(expanded = menu, onDismissRequest = { menu = false }) {
                                DropdownMenuItem(text = { Text("Rename") }, onClick = { menu = false; renaming = r })
                                DropdownMenuItem(text = { Text("Move up") }, onClick = { menu = false; vm.store.move(r.id, -1) })
                                DropdownMenuItem(text = { Text("Move down") }, onClick = { menu = false; vm.store.move(r.id, 1) })
                                if (r.kind == "ir") DropdownMenuItem(text = { Text("Share / export (.ir)") }, onClick = { menu = false; onShare(r) })
                                DropdownMenuItem(text = { Text("Delete") }, onClick = { menu = false; deleting = r })
                            }
                        }
                    }
                }
            }
        }
    }
    renaming?.let { r ->
        TextInputDialog("Rename remote", r.name, onDismiss = { renaming = null }) {
            vm.store.upsert(r.copy(name = it)); renaming = null
        }
    }
    deleting?.let { r ->
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { deleting = null },
            title = { Text("Delete ${r.name}?") },
            confirmButton = { TextButton(onClick = { vm.store.delete(r.id); deleting = null }) { Text("Delete") } },
            dismissButton = { TextButton(onClick = { deleting = null }) { Text("Cancel") } },
        )
    }
}

@Composable
fun IndexGate(vm: AppViewModel, content: @Composable (RemoteIndex) -> Unit) {
    when (val s = vm.index.collectAsState().value) {
        is IndexState.Loading -> Column(Modifier.fillMaxWidth().padding(48.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator()
            Spacer(Modifier.height(16.dp))
            Text("Loading the online remote library…")
        }
        is IndexState.Failed -> Column(Modifier.fillMaxWidth().padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(s.message)
            Spacer(Modifier.height(12.dp))
            Button(onClick = { vm.refreshIndex(true) }) { Text("Retry") }
        }
        is IndexState.Ready -> content(s.index)
    }
}

@Composable
fun AddRemoteScreen(vm: AppViewModel, onImportFile: () -> Unit) {
    var showUrl by remember { mutableStateOf(false) }
    Scaffold(topBar = { BackTopBar("Add a remote", vm::back) }) { inner ->
        IndexGate(vm) { index ->
            val counts = remember(index) { index.categories.toMap() }
            LazyColumn(Modifier.fillMaxSize().padding(inner), contentPadding = PaddingValues(16.dp)) {
                item {
                    OutlinedButton(onClick = { vm.go(Screen.Search()) }, Modifier.fillMaxWidth()) {
                        Icon(Icons.Default.Search, null); Spacer(Modifier.width(8.dp)); Text("Search any brand or model")
                    }
                    Spacer(Modifier.height(12.dp))
                    Card(
                        Modifier.fillMaxWidth().clickable { vm.go(Screen.AcWizard("")) },
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                    ) {
                        Column(Modifier.padding(16.dp)) {
                            Text("❄️  Smart AC remote", style = MaterialTheme.typography.titleMedium)
                            Text(
                                "Full control of temperature, mode, fan and swing. Works with Kelvinator, Gree, Voltas, Midea and many other ACs.",
                                style = MaterialTheme.typography.bodySmall,
                            )
                        }
                    }
                    Spacer(Modifier.height(16.dp))
                    Text("Choose the device type", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(8.dp))
                }
                items(Categories.featured.filter { (counts[it.id] ?: 0) > 0 }) { c ->
                    ListItem(
                        leadingContent = { Text(c.emoji, fontSize = 26.sp) },
                        headlineContent = { Text(c.label) },
                        supportingContent = { Text("${counts[c.id]} remotes") },
                        modifier = Modifier.clickable { vm.go(Screen.Brands(c.id)) },
                    )
                }
                item {
                    HorizontalDivider(Modifier.padding(vertical = 8.dp))
                    Text("More device types", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(vertical = 8.dp))
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        AssistChip(onClick = { vm.go(Screen.Brands(null)) }, label = { Text("All brands (${index.entries.size})") })
                        index.categories.filter { (id, _) -> Categories.featured.none { it.id == id } }.forEach { (id, n) ->
                            AssistChip(onClick = { vm.go(Screen.Brands(id)) }, label = { Text("${Categories.label(id)} ($n)") })
                        }
                    }
                    HorizontalDivider(Modifier.padding(vertical = 12.dp))
                    Text("Bring your own code", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(8.dp))
                    OutlinedButton(onClick = onImportFile, Modifier.fillMaxWidth()) { Text("Import .ir file from phone") }
                    OutlinedButton(onClick = { showUrl = true }, Modifier.fillMaxWidth()) { Text("Import from a web link") }
                    OutlinedButton(onClick = { vm.go(Screen.CodeLab()) }, Modifier.fillMaxWidth()) { Text("Enter a code (Pronto / raw / protocol)") }
                    Spacer(Modifier.height(32.dp))
                }
            }
        }
    }
    if (showUrl) ImportUrlDialog(vm) { showUrl = false }
}

@Composable
fun ImportUrlDialog(vm: AppViewModel, onClose: () -> Unit) {
    val scope = androidx.compose.runtime.rememberCoroutineScope()
    var busy by remember { mutableStateOf(false) }
    TextInputDialog(
        title = "Paste a link to an .ir file (GitHub links work)", initial = "https://", confirm = if (busy) "Loading…" else "Import",
        onDismiss = onClose,
    ) { url ->
        if (busy) return@TextInputDialog
        busy = true
        scope.launch {
            try {
                val text = vm.repo.fetchUrl(url)
                if (FlipperIr.parse(text).isEmpty()) vm.toast("No IR buttons found at that link")
                else vm.go(Screen.Preview(importedText = text, importedTitle = url.substringAfterLast('/').substringBefore('?').removeSuffix(".ir")))
                onClose()
            } catch (e: Exception) {
                vm.toast("Download failed: ${e.message}")
            } finally {
                busy = false
            }
        }
    }
}

@Composable
fun BrandsScreen(vm: AppViewModel, category: String?) {
    var filter by remember { mutableStateOf("") }
    Scaffold(topBar = { BackTopBar(if (category == null) "All brands" else Categories.label(category) + " brands", vm::back) }) { inner ->
        IndexGate(vm) { index ->
            val brands = remember(index, category) { index.brandsIn(category) }
            val popular = remember(brands) { brands.sortedByDescending { it.count }.take(12) }
            val shown = remember(filter, brands) {
                val f = filter.trim().lowercase()
                if (f.isEmpty()) brands else brands.filter { it.name.lowercase().contains(f) || it.key.contains(f) }
            }
            LazyColumn(Modifier.fillMaxSize().padding(inner), contentPadding = PaddingValues(16.dp)) {
                item {
                    if (category == "ACs") {
                        Card(
                            Modifier.fillMaxWidth().clickable { vm.go(Screen.AcWizard("")) },
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                        ) {
                            Text(
                                "❄️  Tip: try the Smart AC remote first. It works with ACs not listed here (Kelvinator, Voltas, Lloyd, Blue Star…).",
                                Modifier.padding(16.dp),
                            )
                        }
                        Spacer(Modifier.height(12.dp))
                    }
                    OutlinedTextField(
                        value = filter, onValueChange = { filter = it }, modifier = Modifier.fillMaxWidth(),
                        singleLine = true, label = { Text("Find your brand") },
                        leadingIcon = { Icon(Icons.Default.Search, null) },
                    )
                    Spacer(Modifier.height(10.dp))
                    if (category != null) {
                        Button(
                            onClick = {
                                val all = index.inCategory(category).sortedWith(compareBy<com.xaviourzone.universalremote.data.IndexEntry>({ it.converted }, { -(brands.firstOrNull { b -> b.key == it.brandKey }?.count ?: 0) }))
                                vm.go(Screen.Wizard("All ${Categories.label(category)} brands", category, all))
                            },
                            modifier = Modifier.fillMaxWidth(),
                        ) { Text("Don't know the brand? Scan all codes") }
                        Spacer(Modifier.height(10.dp))
                    }
                    if (filter.isBlank()) {
                        Text("Popular", style = MaterialTheme.typography.titleSmall)
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            popular.forEach { b -> AssistChip(onClick = { vm.go(Screen.Models(category, b.key)) }, label = { Text(b.name) }) }
                        }
                        Spacer(Modifier.height(8.dp))
                    }
                    if (shown.isEmpty()) {
                        Text("Brand not listed here? Use “Scan all codes”, search all device types, or try the Smart AC remote for air conditioners.")
                        TextButton(onClick = { vm.go(Screen.Search(filter)) }) { Text("Search everywhere for “$filter”") }
                    }
                }
                items(shown, key = { it.key }) { b ->
                    ListItem(
                        headlineContent = { Text(b.name) },
                        trailingContent = { Text("${b.count}") },
                        modifier = Modifier.clickable { vm.go(Screen.Models(category, b.key)) },
                    )
                }
            }
        }
    }
}

@Composable
fun ModelsScreen(vm: AppViewModel, category: String?, brandKey: String) {
    IndexGate(vm) { index ->
        val files = remember(index, category, brandKey) { index.filesFor(category, brandKey) }
        val brand = index.brandName(brandKey)
        Scaffold(topBar = { BackTopBar(brand, vm::back) }) { inner ->
            LazyColumn(Modifier.fillMaxSize().padding(inner), contentPadding = PaddingValues(16.dp)) {
                item {
                    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) {
                        Column(Modifier.padding(16.dp)) {
                            Text("Not sure which model?", style = MaterialTheme.typography.titleMedium)
                            Text("Auto-detect sends POWER from each of the ${files.size} $brand remotes one by one. Tap “Yes” when your device reacts.")
                            Spacer(Modifier.height(8.dp))
                            Button(onClick = { vm.go(Screen.Wizard(brand, category, files)) }, Modifier.fillMaxWidth()) {
                                Text("Auto-detect my $brand remote")
                            }
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    if (category != null) {
                        TextButton(onClick = { vm.go(Screen.Models(null, brandKey)) }) { Text("Show all $brand devices") }
                    }
                    Text("Or pick the model", style = MaterialTheme.typography.titleSmall)
                }
                items(files.size) { i ->
                    val e = files[i]
                    EntryRow(index, e, showBrand = false) { vm.go(Screen.Preview(files, i)) }
                }
            }
        }
    }
}

@Composable
fun EntryRow(index: RemoteIndex, e: IndexEntry, showBrand: Boolean = true, onClick: () -> Unit) {
    ListItem(
        leadingContent = { Text(Categories.emoji(e.category), fontSize = 22.sp) },
        headlineContent = { Text(if (showBrand) "${index.brandName(e.brandKey)} · ${e.model}" else e.model, maxLines = 2, overflow = TextOverflow.Ellipsis) },
        supportingContent = { Text("${Categories.label(e.category)} · ${e.buttons} buttons" + if (e.converted) " · extra" else "") },
        modifier = Modifier.clickable(onClick = onClick),
    )
}

@Composable
fun SearchScreen(vm: AppViewModel, initial: String) {
    var q by remember { mutableStateOf(initial) }
    var submitted by remember { mutableStateOf(initial) }
    Scaffold(topBar = { BackTopBar("Search remotes", vm::back) }) { inner ->
        IndexGate(vm) { index ->
            val results = remember(submitted, index) { index.search(submitted) }
            LazyColumn(Modifier.fillMaxSize().padding(inner), contentPadding = PaddingValues(16.dp)) {
                item {
                    OutlinedTextField(
                        value = q, onValueChange = { q = it; if (it.length >= 2) submitted = it },
                        modifier = Modifier.fillMaxWidth(), singleLine = true,
                        label = { Text("Brand, model or device (e.g. “TCL 43”, “Samsung AC”)") },
                        leadingIcon = { Icon(Icons.Default.Search, null) },
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                        keyboardActions = KeyboardActions(onSearch = { submitted = q }),
                    )
                    Spacer(Modifier.height(8.dp))
                    if (submitted.isNotBlank()) {
                        Text("${results.size} results${if (results.size >= 300) " (showing first 300)" else ""}", style = MaterialTheme.typography.bodySmall)
                        if (results.size > 1) {
                            TextButton(onClick = { vm.go(Screen.Wizard("“$submitted”", null, results)) }) {
                                Text("Auto-test all ${results.size} results")
                            }
                        }
                    }
                }
                items(results.size) { i -> EntryRow(index, results[i]) { vm.go(Screen.Preview(results, i)) } }
            }
        }
    }
}
