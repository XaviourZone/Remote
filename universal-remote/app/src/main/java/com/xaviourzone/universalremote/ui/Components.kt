@file:OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class, ExperimentalLayoutApi::class)

package com.xaviourzone.universalremote.ui

import android.view.HapticFeedbackConstants
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.xaviourzone.universalremote.ir.IrButton
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun BackTopBar(title: String, onBack: () -> Unit, actions: @Composable () -> Unit = {}) {
    TopAppBar(
        title = { Text(title, maxLines = 1, overflow = TextOverflow.Ellipsis) },
        navigationIcon = {
            IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back") }
        },
        actions = { actions() },
    )
}

/**
 * A remote key. Tap sends once; if [repeatOnHold] holding keeps sending (volume, channel, arrows).
 * Long-press (when not repeating) calls [onLongPress].
 */
@Composable
fun RemoteKey(
    label: String,
    modifier: Modifier = Modifier,
    size: Dp = 64.dp,
    width: Dp = size,
    shape: Shape = CircleShape,
    container: Color = MaterialTheme.colorScheme.secondaryContainer,
    content: Color = MaterialTheme.colorScheme.onSecondaryContainer,
    repeatOnHold: Boolean = false,
    enabled: Boolean = true,
    fontSize: Int = 15,
    onLongPress: (() -> Unit)? = null,
    onPress: () -> Unit,
) {
    val view = LocalView.current
    val scope = rememberCoroutineScope()
    val bg = if (enabled) container else container.copy(alpha = 0.35f)
    val currentPress by rememberUpdatedState(onPress)
    val press = {
        view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
        currentPress()
    }
    val base = modifier
        .width(width)
        .height(size)
        .clip(shape)
        .background(bg)
    val interactive = when {
        !enabled -> base
        repeatOnHold -> base.pointerInput(label) {
            detectTapGestures(onPress = {
                press()
                val job = scope.launch {
                    delay(450)
                    while (true) { press(); delay(170) }
                }
                tryAwaitRelease()
                job.cancel()
            })
        }
        else -> base.combinedClickable(onClick = press, onLongClick = onLongPress)
    }
    Box(interactive, contentAlignment = Alignment.Center) {
        Text(
            label, color = if (enabled) content else content.copy(alpha = 0.4f), fontSize = fontSize.sp,
            fontWeight = FontWeight.SemiBold, textAlign = TextAlign.Center, maxLines = 2,
            overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(horizontal = 4.dp),
        )
    }
}

/** Maps button names from thousands of different remotes to common roles. */
object ButtonRoles {
    enum class Role { POWER, MUTE, VOL_UP, VOL_DOWN, CH_UP, CH_DOWN, UP, DOWN, LEFT, RIGHT, OK, BACK, HOME, MENU, INPUT, EXIT, INFO }

    fun norm(name: String): String =
        name.lowercase().replace("+", "plus").replace("-", "minus").replace(Regex("[^a-z0-9]"), "")

    private val table: Map<Role, Set<String>> = mapOf(
        Role.POWER to setOf("power", "pwr", "powertoggle", "poweronoff", "onoff", "standby", "powerstandby"),
        Role.MUTE to setOf("mute", "muting", "soundoff"),
        Role.VOL_UP to setOf("volup", "volplus", "volumeup", "volumeplus", "vplus", "volumplus"),
        Role.VOL_DOWN to setOf("voldn", "voldown", "volminus", "volumedown", "volumeminus", "vminus", "volumedn"),
        Role.CH_UP to setOf("chnext", "chup", "chplus", "channelup", "channelplus", "prognext", "progplus", "pplus", "programup", "chanup"),
        Role.CH_DOWN to setOf("chprev", "chdn", "chdown", "chminus", "channeldown", "channelminus", "progprev", "progminus", "pminus", "programdown", "chandown"),
        Role.UP to setOf("up", "cursorup", "arrowup", "navup", "dpadup"),
        Role.DOWN to setOf("down", "dn", "cursordown", "arrowdown", "navdown", "dpaddown"),
        Role.LEFT to setOf("left", "cursorleft", "arrowleft", "navleft", "dpadleft"),
        Role.RIGHT to setOf("right", "cursorright", "arrowright", "navright", "dpadright"),
        Role.OK to setOf("ok", "enter", "select", "center", "okenter", "confirm"),
        Role.BACK to setOf("back", "return", "previous", "backreturn"),
        Role.HOME to setOf("home", "smarthub", "homepage"),
        Role.MENU to setOf("menu", "settings", "setup"),
        Role.INPUT to setOf("input", "source", "avtv", "tvav", "inputsource", "av", "inputselect"),
        Role.EXIT to setOf("exit", "quit"),
        Role.INFO to setOf("info", "display", "information"),
    )

    fun roleOf(name: String): Role? {
        val n = norm(name)
        return table.entries.firstOrNull { n in it.value }?.key
    }

    fun digitOf(name: String): Int? {
        val n = norm(name).removePrefix("num").removePrefix("key").removePrefix("digit").removePrefix("btn")
        return if (n.length == 1 && n[0].isDigit()) n[0] - '0' else null
    }
}

/**
 * Smart layout for any remote: known keys (power, volume, channel, arrows, numbers) are
 * placed like a real remote, every other key goes into the grid below.
 */
@Composable
fun RemotePad(
    buttons: List<IrButton>,
    onSend: (IrButton, Int) -> Unit,
    onLongPress: ((IrButton, Int) -> Unit)? = null,
) {
    val roles = remember(buttons) {
        val m = HashMap<ButtonRoles.Role, Int>()
        buttons.forEachIndexed { i, b -> ButtonRoles.roleOf(b.name)?.let { r -> if (r !in m) m[r] = i } }
        m
    }
    val digits = remember(buttons) {
        val m = HashMap<Int, Int>()
        buttons.forEachIndexed { i, b -> ButtonRoles.digitOf(b.name)?.let { d -> if (d !in m) m[d] = i } }
        m
    }
    val used = remember(roles, digits) { (roles.values + digits.values).toSet() }
    var showDigits by remember { mutableStateOf(false) }

    @Composable
    fun padKey(role: ButtonRoles.Role, label: String, size: Dp = 64.dp, repeat: Boolean = false, color: Color? = null) {
        val i = roles[role]
        RemoteKey(
            label = label, size = size, enabled = i != null, repeatOnHold = repeat,
            container = color ?: MaterialTheme.colorScheme.secondaryContainer,
            content = if (color != null) Color.White else MaterialTheme.colorScheme.onSecondaryContainer,
            onLongPress = if (i != null && onLongPress != null) ({ onLongPress(buttons[i], i) }) else null,
        ) { if (i != null) onSend(buttons[i], i) }
    }

    val hasTvLayout = roles.size >= 3
    Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        if (hasTvLayout) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                padKey(ButtonRoles.Role.POWER, "⏻", color = PowerRed)
                padKey(ButtonRoles.Role.INPUT, "Input")
                padKey(ButtonRoles.Role.MUTE, "Mute")
                padKey(if (roles.containsKey(ButtonRoles.Role.HOME)) ButtonRoles.Role.HOME else ButtonRoles.Role.MENU,
                    if (roles.containsKey(ButtonRoles.Role.HOME)) "Home" else "Menu")
            }
            Spacer(Modifier.height(20.dp))
            // D-pad
            if (roles.keys.any { it in setOf(ButtonRoles.Role.UP, ButtonRoles.Role.OK, ButtonRoles.Role.LEFT) }) {
                padKey(ButtonRoles.Role.UP, "▲", repeat = true)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    padKey(ButtonRoles.Role.LEFT, "◀", repeat = true)
                    Spacer(Modifier.width(10.dp))
                    padKey(ButtonRoles.Role.OK, "OK", size = 76.dp, color = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.width(10.dp))
                    padKey(ButtonRoles.Role.RIGHT, "▶", repeat = true)
                }
                padKey(ButtonRoles.Role.DOWN, "▼", repeat = true)
                Spacer(Modifier.height(12.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                    padKey(ButtonRoles.Role.BACK, "Back", size = 52.dp)
                    padKey(ButtonRoles.Role.MENU, "Menu", size = 52.dp)
                    padKey(ButtonRoles.Role.EXIT, "Exit", size = 52.dp)
                    padKey(ButtonRoles.Role.INFO, "Info", size = 52.dp)
                }
                Spacer(Modifier.height(20.dp))
            }
            // Volume and channel rockers
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    RockerHalf(roles[ButtonRoles.Role.VOL_UP], "VOL +", true, buttons, onSend)
                    Spacer(Modifier.height(4.dp))
                    RockerHalf(roles[ButtonRoles.Role.VOL_DOWN], "VOL −", false, buttons, onSend)
                }
                if (digits.size >= 9) {
                    RemoteKey("123", size = 56.dp, onPress = { showDigits = !showDigits })
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    RockerHalf(roles[ButtonRoles.Role.CH_UP], "CH +", true, buttons, onSend)
                    Spacer(Modifier.height(4.dp))
                    RockerHalf(roles[ButtonRoles.Role.CH_DOWN], "CH −", false, buttons, onSend)
                }
            }
            if (showDigits) {
                Spacer(Modifier.height(16.dp))
                for (row in listOf(listOf(1, 2, 3), listOf(4, 5, 6), listOf(7, 8, 9), listOf(-1, 0, -1))) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                        for (d in row) {
                            if (d < 0) Spacer(Modifier.size(64.dp)) else {
                                val i = digits[d]
                                RemoteKey("$d", enabled = i != null) { if (i != null) onSend(buttons[i], i) }
                            }
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                }
            }
            Spacer(Modifier.height(20.dp))
        }
        val rest = buttons.withIndex().filter { !hasTvLayout || it.index !in used }
        if (rest.isNotEmpty()) {
            if (hasTvLayout) Text("More buttons", style = MaterialTheme.typography.titleSmall, modifier = Modifier.padding(bottom = 8.dp))
            FlowRow(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                for ((i, b) in rest) {
                    val isPower = ButtonRoles.roleOf(b.name) == ButtonRoles.Role.POWER ||
                        b.name.lowercase().let { it == "off" || it.startsWith("power") }
                    RemoteKey(
                        label = b.name.replace('_', ' '), width = 104.dp, size = 52.dp,
                        shape = RoundedCornerShape(16.dp), fontSize = 13,
                        container = if (isPower) PowerRed else MaterialTheme.colorScheme.secondaryContainer,
                        content = if (isPower) Color.White else MaterialTheme.colorScheme.onSecondaryContainer,
                        onLongPress = onLongPress?.let { f -> { f(b, i) } },
                    ) { onSend(b, i) }
                }
            }
        }
        Spacer(Modifier.height(96.dp))
    }
}

@Composable
private fun RockerHalf(index: Int?, label: String, top: Boolean, buttons: List<IrButton>, onSend: (IrButton, Int) -> Unit) {
    RemoteKey(
        label = label, width = 92.dp, size = 64.dp, repeatOnHold = true, enabled = index != null,
        shape = if (top) RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp, bottomStart = 8.dp, bottomEnd = 8.dp)
        else RoundedCornerShape(topStart = 8.dp, topEnd = 8.dp, bottomStart = 32.dp, bottomEnd = 32.dp),
    ) { if (index != null) onSend(buttons[index], index) }
}

@Composable
fun TextInputDialog(
    title: String,
    initial: String,
    confirm: String = "Save",
    onDismiss: () -> Unit,
    onConfirm: (String) -> Unit,
) {
    var text by remember { mutableStateOf(initial) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = { OutlinedTextField(value = text, onValueChange = { text = it }, singleLine = true) },
        confirmButton = { TextButton(enabled = text.isNotBlank(), onClick = { onConfirm(text.trim()) }) { Text(confirm) } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}

@Composable
fun CenterMessage(text: String, modifier: Modifier = Modifier) {
    Box(modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
        Text(text, textAlign = TextAlign.Center, style = MaterialTheme.typography.bodyLarge)
    }
}
