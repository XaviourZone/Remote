package com.xaviourzone.universalremote

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.key
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.xaviourzone.universalremote.ir.FlipperIr
import com.xaviourzone.universalremote.ui.AcWizardScreen
import com.xaviourzone.universalremote.ui.AddRemoteScreen
import com.xaviourzone.universalremote.ui.AppViewModel
import com.xaviourzone.universalremote.ui.BrandsScreen
import com.xaviourzone.universalremote.ui.CodeLabScreen
import com.xaviourzone.universalremote.ui.FixButtonScreen
import com.xaviourzone.universalremote.ui.HomeScreen
import com.xaviourzone.universalremote.ui.ModelsScreen
import com.xaviourzone.universalremote.ui.PreviewScreen
import com.xaviourzone.universalremote.ui.RemoteScreen
import com.xaviourzone.universalremote.ui.Screen
import com.xaviourzone.universalremote.ui.SearchScreen
import com.xaviourzone.universalremote.ui.SettingsScreen
import com.xaviourzone.universalremote.ui.UniversalRemoteTheme
import com.xaviourzone.universalremote.ui.WizardScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            UniversalRemoteTheme {
                val vm: AppViewModel = viewModel()
                val snackbar = remember { SnackbarHostState() }
                LaunchedEffect(Unit) { vm.messages.collect { snackbar.showSnackbar(it) } }

                val importLauncher = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
                    if (uri == null) return@rememberLauncherForActivityResult
                    try {
                        val text = contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() } ?: ""
                        if (FlipperIr.parse(text).isEmpty()) vm.toast("No IR buttons found in that file")
                        else {
                            val name = uri.lastPathSegment?.substringAfterLast('/')?.substringAfterLast(':')?.removeSuffix(".ir") ?: "Imported remote"
                            vm.go(Screen.Preview(importedText = text, importedTitle = name))
                        }
                    } catch (e: Exception) {
                        vm.toast("Couldn't read file: ${e.message}")
                    }
                }

                BackHandler(enabled = vm.stack.size > 1) { vm.back() }

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    snackbarHost = { SnackbarHost(snackbar) },
                    contentWindowInsets = WindowInsets(0, 0, 0, 0),
                ) { padding ->
                    val screen = vm.stack.last()
                    androidx.compose.foundation.layout.Box(Modifier.padding(padding)) {
                      key(vm.stack.size, screen) {
                        when (screen) {
                            is Screen.Home -> HomeScreen(vm, androidx.compose.foundation.layout.PaddingValues()) { r ->
                                val send = Intent(Intent.ACTION_SEND).apply {
                                    type = "text/plain"
                                    putExtra(Intent.EXTRA_SUBJECT, "${r.name}.ir")
                                    putExtra(Intent.EXTRA_TEXT, r.irText)
                                }
                                startActivity(Intent.createChooser(send, "Share ${r.name}"))
                            }
                            is Screen.AddRemote -> AddRemoteScreen(vm) { importLauncher.launch(arrayOf("*/*")) }
                            is Screen.Brands -> BrandsScreen(vm, screen.category)
                            is Screen.Models -> ModelsScreen(vm, screen.category, screen.brandKey)
                            is Screen.Preview -> PreviewScreen(vm, screen)
                            is Screen.Wizard -> WizardScreen(vm, screen.title, screen.category, screen.candidates)
                            is Screen.AcWizard -> AcWizardScreen(vm)
                            is Screen.Remote -> RemoteScreen(vm, screen.id)
                            is Screen.Search -> SearchScreen(vm, screen.initial)
                            is Screen.CodeLab -> CodeLabScreen(vm, screen.targetRemoteId)
                            is Screen.FixButton -> FixButtonScreen(vm, screen.remoteId, screen.buttonIndex)
                            is Screen.Settings -> SettingsScreen(vm)
                        }
                      }
                    }
                }
            }
        }
    }
}
