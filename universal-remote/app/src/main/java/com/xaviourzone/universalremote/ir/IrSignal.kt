package com.xaviourzone.universalremote.ir

/** A ready-to-send IR burst: carrier frequency in Hz and alternating on/off durations in microseconds. */
class IrPattern(val frequency: Int, val timings: IntArray) {
    val durationMs: Long get() = timings.sumOf { it.toLong() } / 1000
}

sealed class IrSignal {
    /** A decoded signal (as stored by Flipper Zero): protocol name plus address/command. */
    data class Parsed(val protocol: String, val address: Long, val command: Long) : IrSignal()

    /** A raw capture. [timings] start with a mark (carrier on). */
    data class Raw(val frequency: Int, val dutyCycle: Double, val timings: IntArray) : IrSignal() {
        override fun equals(other: Any?): Boolean =
            other is Raw && other.frequency == frequency && other.timings.contentEquals(timings)

        override fun hashCode(): Int = 31 * frequency + timings.contentHashCode()
    }
}

data class IrButton(val name: String, val signal: IrSignal)

/** Reader / writer for the Flipper Zero ".ir" text format used by Flipper-IRDB. */
object FlipperIr {

    fun parse(text: String): List<IrButton> {
        val buttons = ArrayList<IrButton>()
        var fields = HashMap<String, String>()

        fun flush() {
            val name = fields["name"]
            if (name != null) {
                toSignal(fields)?.let { buttons.add(IrButton(name, it)) }
            }
            fields = HashMap()
        }

        for (rawLine in text.lineSequence()) {
            val line = rawLine.trim()
            if (line.isEmpty() || line.startsWith("#")) continue
            val colon = line.indexOf(':')
            if (colon <= 0) continue
            val key = line.substring(0, colon).trim().lowercase()
            val value = line.substring(colon + 1).trim()
            if (key == "name") flush()
            if (key == "data" && fields.containsKey("data")) {
                // Some converted files split raw data over several lines.
                fields["data"] = fields["data"] + " " + value
            } else {
                fields[key] = value
            }
        }
        flush()
        return buttons
    }

    private fun toSignal(f: Map<String, String>): IrSignal? {
        return when (f["type"]?.lowercase()) {
            "parsed" -> {
                val protocol = f["protocol"] ?: return null
                val address = hexBytesLe(f["address"] ?: return null) ?: return null
                val command = hexBytesLe(f["command"] ?: return null) ?: return null
                IrSignal.Parsed(protocol, address, command)
            }
            "raw" -> {
                val freq = f["frequency"]?.toDoubleOrNull()?.toInt() ?: 38000
                val duty = f["duty_cycle"]?.toDoubleOrNull() ?: 0.33
                val data = f["data"] ?: return null
                val timings = data.split(Regex("[\\s,]+"))
                    .mapNotNull { it.toDoubleOrNull()?.toInt() }
                    .map { kotlin.math.abs(it) }
                    .filter { it > 0 }
                if (timings.isEmpty()) return null
                IrSignal.Raw(freq, duty, timings.toIntArray())
            }
            else -> null
        }
    }

    /** "04 00 00 00" (little endian bytes) -> 4 */
    private fun hexBytesLe(s: String): Long? {
        val parts = s.split(Regex("\\s+")).filter { it.isNotEmpty() }
        var v = 0L
        for ((i, p) in parts.withIndex()) {
            if (i >= 8) break
            val b = p.toIntOrNull(16) ?: return null
            v = v or ((b.toLong() and 0xFF) shl (8 * i))
        }
        return v
    }

    private fun leHex(v: Long): String =
        (0 until 4).joinToString(" ") { "%02X".format(((v ushr (8 * it)) and 0xFF).toInt()) }

    fun serialize(buttons: List<IrButton>, comment: String? = null): String {
        val sb = StringBuilder()
        sb.append("Filetype: IR signals file\nVersion: 1\n")
        if (comment != null) sb.append("# ").append(comment.replace("\n", " ")).append('\n')
        for (b in buttons) {
            sb.append("#\nname: ").append(b.name).append('\n')
            when (val s = b.signal) {
                is IrSignal.Parsed -> {
                    sb.append("type: parsed\nprotocol: ").append(s.protocol).append('\n')
                    sb.append("address: ").append(leHex(s.address)).append('\n')
                    sb.append("command: ").append(leHex(s.command)).append('\n')
                }
                is IrSignal.Raw -> {
                    sb.append("type: raw\nfrequency: ").append(s.frequency).append('\n')
                    sb.append("duty_cycle: ").append("%.6f".format(java.util.Locale.US, s.dutyCycle)).append('\n')
                    sb.append("data: ").append(s.timings.joinToString(" ")).append('\n')
                }
            }
        }
        return sb.toString()
    }
}

/** Pronto hex ("0000 006D 0022 0002 ...") support. */
object Pronto {
    fun parse(text: String): IrSignal.Raw? {
        val words = text.trim().split(Regex("[\\s,]+")).filter { it.isNotEmpty() }
            .map { it.toIntOrNull(16) ?: return null }
        if (words.size < 6 || words[0] != 0) return null
        val freqWord = words[1]
        if (freqWord == 0) return null
        val frequency = (1_000_000.0 / (freqWord * 0.241246)).toInt()
        val period = 1_000_000.0 / frequency
        val once = words[2]
        val repeat = words[3]
        val body = words.drop(4)
        val pairs = if (once > 0) body.take(once * 2) else body.take(repeat * 2)
        if (pairs.isEmpty()) return null
        val timings = pairs.map { (it * period).toInt().coerceAtLeast(1) }.toIntArray()
        return IrSignal.Raw(frequency, 0.33, timings)
    }
}

/** Plain raw timing list like "9000 4500 560 560 ..." or "+9000 -4500 ...". */
object RawText {
    fun parse(text: String, frequency: Int = 38000): IrSignal.Raw? {
        val nums = text.split(Regex("[\\s,]+")).filter { it.isNotEmpty() }
            .map { it.removePrefix("+").removePrefix("-").toIntOrNull() ?: return null }
            .filter { it > 0 }
        if (nums.size < 4) return null
        return IrSignal.Raw(frequency, 0.33, nums.toIntArray())
    }
}
