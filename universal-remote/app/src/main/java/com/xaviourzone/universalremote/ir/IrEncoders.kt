package com.xaviourzone.universalremote.ir

/**
 * Builds an on/off duration list, merging consecutive marks/spaces and
 * dropping leading spaces (Android's ConsumerIrManager patterns must start with "on").
 */
class PatternBuilder {
    private val list = ArrayList<Int>(256)
    private var lastIsMark = false

    fun mark(us: Int) {
        if (us <= 0) return
        if (list.isNotEmpty() && lastIsMark) list[list.size - 1] += us else list.add(us)
        lastIsMark = true
    }

    fun space(us: Int) {
        if (us <= 0 || list.isEmpty()) return
        if (!lastIsMark) list[list.size - 1] += us else list.add(us)
        lastIsMark = false
    }

    fun sum(): Long = list.sumOf { it.toLong() }

    fun dropTrailingSpace() {
        if (list.isNotEmpty() && !lastIsMark) {
            list.removeAt(list.size - 1)
            lastIsMark = true
        }
    }

    fun toArray(): IntArray = list.toIntArray()

    /** Bytes, each sent LSB first (or MSB first) using pulse distance encoding. */
    fun bytes(
        data: IntArray, from: Int, to: Int, oneMark: Int, oneSpace: Int, zeroMark: Int, zeroSpace: Int,
        msbFirst: Boolean = false,
    ) {
        for (i in from until to) bits(data[i].toLong() and 0xFF, 8, oneMark, oneSpace, zeroMark, zeroSpace, msbFirst)
    }

    fun bits(
        value: Long, nbits: Int, oneMark: Int, oneSpace: Int, zeroMark: Int, zeroSpace: Int,
        msbFirst: Boolean = false,
    ) {
        for (i in 0 until nbits) {
            val bitIndex = if (msbFirst) nbits - 1 - i else i
            val bit = (value ushr bitIndex) and 1L
            if (bit == 1L) { mark(oneMark); space(oneSpace) } else { mark(zeroMark); space(zeroSpace) }
        }
    }
}

/**
 * Encoders for every protocol used in Flipper-IRDB "parsed" signals.
 * Bit layouts mirror the Flipper Zero firmware (lib/infrared/encoder_decoder), so
 * the decoded files in the database reproduce the exact original waveform.
 */
object FlipperProtocols {
    val supported = listOf(
        "NEC", "NECext", "NEC42", "NEC42ext", "Samsung32", "RC5", "RC5X", "RC6",
        "SIRC", "SIRC15", "SIRC20", "Kaseikyo", "RCA", "Pioneer",
    )

    private var rcToggle = false

    private fun rev8(v: Int): Int {
        var r = 0
        for (i in 0 until 8) if (v and (1 shl i) != 0) r = r or (1 shl (7 - i))
        return r
    }

    private class Pdwm(
        val freq: Int, val preMark: Int, val preSpace: Int,
        val b1m: Int, val b1s: Int, val b0m: Int, val b0s: Int,
    )

    private val NEC = Pdwm(38000, 9000, 4500, 560, 1690, 560, 560)
    private val SAMSUNG = Pdwm(38000, 4500, 4500, 550, 1650, 550, 550)
    private val SIRC = Pdwm(40000, 2400, 600, 1200, 600, 600, 600)
    private val KASEIKYO = Pdwm(38000, 3456, 1728, 432, 1296, 432, 432)
    private val RCA = Pdwm(38000, 4000, 4000, 500, 2000, 500, 1000)
    private val PIONEER = Pdwm(40000, 8500, 4225, 500, 1500, 500, 500)

    /** Pulse-distance / pulse-width frame exactly like infrared_common_encode_pdwm. */
    private fun pdwmFrame(b: PatternBuilder, t: Pdwm, data: Long, nbits: Int) {
        b.mark(t.preMark); b.space(t.preSpace)
        val pwm = t.b1s == t.b0s
        for (i in 0 until nbits) {
            val one = (data ushr i) and 1L == 1L
            b.mark(if (one) t.b1m else t.b0m)
            if (pwm && i == nbits - 1) break // pulse width: frame ends on the last mark
            b.space(if (one) t.b1s else t.b0s)
        }
        if (!pwm) b.mark(t.b0m) // stop bit
    }

    private fun manchester(b: PatternBuilder, data: Long, nbits: Int, half: Int, toggleIndex: Int) {
        for (i in 0 until nbits) {
            val logic = (data ushr i) and 1L == 1L
            val d = if (i == toggleIndex) half * 2 else half
            // First half: level == logic value, second half: inverted.
            if (logic) { b.mark(d); b.space(d) } else { b.space(d); b.mark(d) }
        }
        b.dropTrailingSpace()
    }

    fun encode(sig: IrSignal.Parsed): IrPattern? {
        val a = sig.address
        val c = sig.command
        val b = PatternBuilder()
        when (sig.protocol.trim().lowercase()) {
            "nec" -> {
                val ad = (a and 0xFF); val cm = (c and 0xFF)
                val data = ad or ((ad.inv() and 0xFF) shl 8) or (cm shl 16) or ((cm.inv() and 0xFF) shl 24)
                pdwmFrame(b, NEC, data, 32); padTo(b, 110_000)
                return IrPattern(NEC.freq, b.toArray())
            }
            "necext" -> {
                val data = (a and 0xFFFF) or ((c and 0xFFFF) shl 16)
                pdwmFrame(b, NEC, data, 32); padTo(b, 110_000)
                return IrPattern(NEC.freq, b.toArray())
            }
            "nec42" -> {
                val data = (a and 0x1FFF) or ((a.inv() and 0x1FFF) shl 13) or ((c and 0xFF) shl 26) or
                    ((c.inv() and 0xFF) shl 34)
                pdwmFrame(b, NEC, data, 42); padTo(b, 110_000)
                return IrPattern(NEC.freq, b.toArray())
            }
            "nec42ext" -> {
                val data = (a and 0x3FFFFFF) or ((c and 0xFFFF) shl 26)
                pdwmFrame(b, NEC, data, 42); padTo(b, 110_000)
                return IrPattern(NEC.freq, b.toArray())
            }
            "samsung32" -> {
                val ad = a and 0xFF; val cm = c and 0xFF
                val data = ad or (ad shl 8) or (cm shl 16) or ((cm.inv() and 0xFF) shl 24)
                pdwmFrame(b, SAMSUNG, data, 32); b.space(46_000)
                return IrPattern(SAMSUNG.freq, b.toArray())
            }
            "sirc", "sirc15", "sirc20" -> {
                val (data, n) = when (sig.protocol.lowercase()) {
                    "sirc" -> ((c and 0x7F) or ((a and 0x1F) shl 7)) to 12
                    "sirc15" -> ((c and 0x7F) or ((a and 0xFF) shl 7)) to 15
                    else -> ((c and 0x7F) or ((a and 0x1FFF) shl 7)) to 20
                }
                repeat(3) {
                    val start = b.sum()
                    pdwmFrame(b, SIRC, data, n)
                    b.space((45_000 - (b.sum() - start)).toInt().coerceAtLeast(10_000))
                }
                return IrPattern(SIRC.freq, b.toArray())
            }
            "kaseikyo" -> {
                val id = ((a ushr 24) and 3).toInt()
                val vendor = ((a ushr 8) and 0xFFFF).toInt()
                val genre1 = ((a ushr 4) and 0xF).toInt()
                val genre2 = (a and 0xF).toInt()
                val cmd = (c and 0x3FF).toInt()
                val d = IntArray(6)
                d[0] = vendor and 0xFF
                d[1] = vendor ushr 8
                var parity = d[0] xor d[1]
                parity = (parity and 0xF) xor (parity ushr 4)
                d[2] = (parity and 0xF) or (genre1 shl 4)
                d[3] = (genre2 and 0xF) or ((cmd and 0xF) shl 4)
                d[4] = ((id shl 6) or (cmd ushr 4)) and 0xFF
                d[5] = d[2] xor d[3] xor d[4]
                var data = 0L
                for (i in 0 until 6) data = data or ((d[i].toLong() and 0xFF) shl (8 * i))
                pdwmFrame(b, KASEIKYO, data, 48); b.space(40_000)
                return IrPattern(KASEIKYO.freq, b.toArray())
            }
            "rca" -> {
                val ad = a and 0xF; val cm = c and 0xFF
                val data = ad or (cm shl 4) or ((ad.inv() and 0xF) shl 12) or ((cm.inv() and 0xFF) shl 16)
                pdwmFrame(b, RCA, data, 24); b.space(8_000)
                return IrPattern(RCA.freq, b.toArray())
            }
            "pioneer" -> {
                val ad = a and 0xFF; val cm = c and 0xFF
                val data = ad or ((ad.inv() and 0xFF) shl 8) or (cm shl 16) or ((cm.inv() and 0xFF) shl 24)
                repeat(2) { pdwmFrame(b, PIONEER, data, 33); b.space(26_000) }
                return IrPattern(PIONEER.freq, b.toArray())
            }
            "rc5", "rc5x" -> {
                val toggle = nextToggle()
                var data = 0x01L
                if (sig.protocol.equals("RC5", true)) data = data or 0x02
                if (toggle) data = data or 0x04
                data = data or (((rev8((a and 0xFF).toInt()) ushr 3) shl 3).toLong())
                data = data or (((rev8((c and 0xFF).toInt()) ushr 2).toLong()) shl 8)
                data = data.inv() and 0xFFFF
                manchester(b, data, 14, 888, -1)
                b.space(27_000)
                return IrPattern(36000, b.toArray())
            }
            "rc6" -> {
                val toggle = nextToggle()
                var data = 0x01L
                if (toggle) data = data or 0x10
                data = data or (rev8((a and 0xFF).toInt()).toLong() shl 5)
                data = data or (rev8((c and 0xFF).toInt()).toLong() shl 13)
                b.mark(2666); b.space(889)
                manchester(b, data, 21, 444, 4)
                b.space(27_000)
                return IrPattern(36000, b.toArray())
            }
        }
        return null
    }

    private fun padTo(b: PatternBuilder, period: Int) {
        val rest = period - b.sum()
        b.space(if (rest > 5_000) rest.toInt() else 40_000)
    }

    @Synchronized
    private fun nextToggle(): Boolean {
        val t = rcToggle
        rcToggle = !rcToggle
        return t
    }
}

object IrEncoder {
    fun encode(signal: IrSignal): IrPattern? = when (signal) {
        is IrSignal.Parsed -> FlipperProtocols.encode(signal)
        is IrSignal.Raw -> {
            val t = signal.timings.filter { it > 0 }
            if (t.isEmpty()) null else IrPattern(signal.frequency.takeIf { it in 10_000..500_000 } ?: 38000, t.toIntArray())
        }
    }
}
