package com.xaviourzone.universalremote.ir

/**
 * "Smart AC" support. Air conditioner remotes send the COMPLETE state (power, mode,
 * temperature, fan, swing) with every key press, so instead of storing a few
 * recorded buttons we generate the full message for any state.
 *
 * Protocol layouts are ported from the IRremoteESP8266 project (LGPL-2.1),
 * which documents and tests them against real units.
 */
enum class AcMode(val label: String) { AUTO("Auto"), COOL("Cool"), DRY("Dry"), FAN("Fan"), HEAT("Heat") }
enum class AcFan(val label: String) { AUTO("Auto"), LOW("Low"), MED("Medium"), HIGH("High") }

data class AcState(
    val power: Boolean = true,
    val mode: AcMode = AcMode.COOL,
    val temp: Int = 24,
    val fan: AcFan = AcFan.AUTO,
    val swing: Boolean = false,
    val turbo: Boolean = false,
)

/** What changed, so that toggle-style protocols (e.g. Coolix swing) can send the right command. */
enum class AcAction { STATE, SWING }

abstract class AcProtocol(val id: String, val title: String, val brands: String) {
    open val minTemp = 16
    open val maxTemp = 30
    abstract fun encode(state: AcState, action: AcAction = AcAction.STATE): IrPattern
}

private fun clampTemp(p: AcProtocol, t: Int) = t.coerceIn(p.minTemp, p.maxTemp)

/** Gree / Kelvinator 8-byte block checksum. */
private fun greeBlockChecksum(raw: IntArray, offset: Int, length: Int = 8): Int {
    var sum = 10
    for (i in 0 until 4) sum += raw[offset + i] and 0x0F
    for (i in 4 until length - 1) sum += (raw[offset + i] ushr 4) and 0x0F
    return sum and 0x0F
}

object KelvinatorAc : AcProtocol("kelvinator", "Kelvinator", "Kelvinator, Gree-made units, Cooper&Hunter, Tosot") {
    private const val TICK = 85
    private const val HDR_MARK = 106 * TICK
    private const val HDR_SPACE = 53 * TICK
    private const val BIT_MARK = 8 * TICK
    private const val ONE_SPACE = 18 * TICK
    private const val ZERO_SPACE = 6 * TICK
    private const val GAP = 235 * TICK

    fun state(
        s: AcState, light: Boolean = true, ion: Boolean = false, xFan: Boolean = false, swingH: Boolean = false,
    ): IntArray {
        val raw = IntArray(16)
        raw[3] = 0x50
        raw[11] = 0x70
        val mode = when (s.mode) {
            AcMode.AUTO -> 0; AcMode.COOL -> 1; AcMode.DRY -> 2; AcMode.FAN -> 3; AcMode.HEAT -> 4
        }
        val temp = if (s.mode == AcMode.AUTO || s.mode == AcMode.DRY) 25 else clampTemp(this, s.temp)
        val fan = when (s.fan) { AcFan.AUTO -> 0; AcFan.LOW -> 1; AcFan.MED -> 3; AcFan.HIGH -> 5 }
        val basicFan = minOf(3, fan)
        val swingAuto = s.swing || swingH
        raw[0] = mode or ((if (s.power) 1 else 0) shl 3) or (basicFan shl 4) or ((if (swingAuto) 1 else 0) shl 6)
        raw[1] = (temp - 16) and 0x0F
        // Turbo (bit4), Light (bit5), Ion (bit6), XFan (bit7, only valid in Cool/Dry)
        val xf = xFan && (s.mode == AcMode.COOL || s.mode == AcMode.DRY)
        raw[2] = ((if (s.turbo) 1 else 0) shl 4) or ((if (light) 1 else 0) shl 5) or
            ((if (ion) 1 else 0) shl 6) or ((if (xf) 1 else 0) shl 7)
        raw[4] = (if (s.swing) 0x01 else 0x00) or ((if (swingH) 1 else 0) shl 4)
        raw[14] = (fan and 0x07) shl 4
        raw[8] = raw[0]; raw[9] = raw[1]; raw[10] = raw[2]
        raw[7] = (raw[7] and 0x0F) or (greeBlockChecksum(raw, 0) shl 4)
        raw[15] = (raw[15] and 0x0F) or (greeBlockChecksum(raw, 8) shl 4)
        return raw
    }

    override fun encode(state: AcState, action: AcAction): IrPattern = encodeRaw(state(state))

    fun encodeRaw(d: IntArray): IrPattern {
        val b = PatternBuilder()
        for (half in 0 until 2) {
            val o = half * 8
            b.mark(HDR_MARK); b.space(HDR_SPACE)
            b.bytes(d, o, o + 4, BIT_MARK, ONE_SPACE, BIT_MARK, ZERO_SPACE)
            b.bits(0b010, 3, BIT_MARK, ONE_SPACE, BIT_MARK, ZERO_SPACE)
            b.mark(BIT_MARK); b.space(GAP)
            b.bytes(d, o + 4, o + 8, BIT_MARK, ONE_SPACE, BIT_MARK, ZERO_SPACE)
            b.mark(BIT_MARK); b.space(GAP * 2)
        }
        return IrPattern(38000, b.toArray())
    }
}

object GreeAc : AcProtocol("gree", "Gree", "Gree, Kelvinator (newer), Tosot, Sinclair, Daitsu, Lloyd*, Onida*") {
    private const val HDR_MARK = 9000
    private const val HDR_SPACE = 4500
    private const val BIT_MARK = 620
    private const val ONE_SPACE = 1600
    private const val ZERO_SPACE = 540
    private const val MSG_SPACE = 19980

    fun state(s: AcState): IntArray {
        val raw = IntArray(8)
        val mode = when (s.mode) {
            AcMode.AUTO -> 0; AcMode.COOL -> 1; AcMode.DRY -> 2; AcMode.FAN -> 3; AcMode.HEAT -> 4
        }
        var fan = when (s.fan) { AcFan.AUTO -> 0; AcFan.LOW -> 1; AcFan.MED -> 2; AcFan.HIGH -> 3 }
        if (s.mode == AcMode.DRY) fan = 1
        val temp = if (s.mode == AcMode.AUTO) 25 else clampTemp(this, s.temp)
        raw[0] = mode or ((if (s.power) 1 else 0) shl 3) or (fan shl 4) or ((if (s.swing) 1 else 0) shl 6)
        raw[1] = (temp - 16) and 0x0F
        // Turbo bit4, Light bit5, ModelA (YAW1F power) bit6
        raw[2] = ((if (s.turbo) 1 else 0) shl 4) or (1 shl 5) or ((if (s.power) 1 else 0) shl 6)
        raw[3] = 0x50
        raw[4] = if (s.swing) 0x01 else 0x00
        raw[5] = 0x20
        raw[7] = (raw[7] and 0x0F) or (greeBlockChecksum(raw, 0) shl 4)
        return raw
    }

    override fun encode(state: AcState, action: AcAction): IrPattern {
        val d = state(state)
        val b = PatternBuilder()
        b.mark(HDR_MARK); b.space(HDR_SPACE)
        b.bytes(d, 0, 4, BIT_MARK, ONE_SPACE, BIT_MARK, ZERO_SPACE)
        b.bits(0b010, 3, BIT_MARK, ONE_SPACE, BIT_MARK, ZERO_SPACE)
        b.mark(BIT_MARK); b.space(MSG_SPACE)
        b.bytes(d, 4, 8, BIT_MARK, ONE_SPACE, BIT_MARK, ZERO_SPACE)
        b.mark(BIT_MARK); b.space(MSG_SPACE)
        return IrPattern(38000, b.toArray())
    }
}

object CoolixAc : AcProtocol("coolix", "Coolix (Midea family)", "Midea, Carrier, Blue Star*, Lloyd*, Voltas*, Whirlpool*, Electrolux, Toshiba, Beko") {
    override val minTemp = 17
    private const val TICK = 276
    private const val BIT_MARK = 2 * TICK
    private const val ONE_SPACE = 6 * TICK
    private const val ZERO_SPACE = 2 * TICK
    private const val HDR_MARK = 17 * TICK
    private const val HDR_SPACE = 16 * TICK
    private const val MIN_GAP = (17 + 2) * TICK
    private val TEMP_MAP = intArrayOf(0x0, 0x1, 0x3, 0x2, 0x6, 0x7, 0x5, 0x4, 0xC, 0xD, 0x9, 0x8, 0xA, 0xB)
    const val OFF = 0xB27BE0L
    const val SWING = 0xB26BE0L

    fun code(s: AcState, action: AcAction): Long {
        if (action == AcAction.SWING) return SWING
        if (!s.power) return OFF
        var mode = when (s.mode) { AcMode.COOL -> 0; AcMode.DRY -> 1; AcMode.AUTO -> 2; AcMode.HEAT -> 3; AcMode.FAN -> 1 }
        var tempCode = TEMP_MAP[clampTemp(this, s.temp) - 17]
        val fan = when {
            s.mode == AcMode.AUTO || s.mode == AcMode.DRY -> 0b000
            s.fan == AcFan.AUTO -> 0b101
            s.fan == AcFan.LOW -> 0b100
            s.fan == AcFan.MED -> 0b010
            else -> 0b001
        }
        if (s.mode == AcMode.FAN) { mode = 1; tempCode = 0b1110 }
        return (0xB2L shl 16) or ((fan.toLong() shl 13) or (0x1FL shl 8)) or (tempCode.toLong() shl 4) or (mode.toLong() shl 2)
    }

    override fun encode(state: AcState, action: AcAction): IrPattern {
        val data = code(state, action)
        val b = PatternBuilder()
        repeat(2) {
            b.mark(HDR_MARK); b.space(HDR_SPACE)
            for (i in 2 downTo 0) {
                val seg = ((data ushr (8 * i)) and 0xFF)
                b.bits(seg, 8, BIT_MARK, ONE_SPACE, BIT_MARK, ZERO_SPACE, msbFirst = true)
                b.bits(seg xor 0xFF, 8, BIT_MARK, ONE_SPACE, BIT_MARK, ZERO_SPACE, msbFirst = true)
            }
            b.mark(BIT_MARK); b.space(MIN_GAP)
        }
        return IrPattern(38000, b.toArray())
    }
}

object MideaAc : AcProtocol("midea", "Midea", "Midea, Pioneer, Comfee, Kaysun, Trotec, some Carrier/Lloyd/Godrej") {
    override val minTemp = 17
    private const val TICK = 80
    private const val BIT_MARK = 7 * TICK
    private const val ONE_SPACE = 21 * TICK
    private const val ZERO_SPACE = 7 * TICK
    private const val HDR = 56 * TICK
    private const val MIN_GAP = (56 + 7 + 7) * TICK
    private const val TOGGLE_SWING = 0xA201FFFFFF7CL

    private fun rev8(v: Int): Int {
        var r = 0
        for (i in 0 until 8) if (v and (1 shl i) != 0) r = r or (1 shl (7 - i))
        return r
    }

    fun code(s: AcState, action: AcAction): Long {
        if (action == AcAction.SWING) return TOGGLE_SWING
        val mode = when (s.mode) { AcMode.COOL -> 0; AcMode.DRY -> 1; AcMode.AUTO -> 2; AcMode.HEAT -> 3; AcMode.FAN -> 4 }
        val fan = when (s.fan) { AcFan.AUTO -> 0; AcFan.LOW -> 1; AcFan.MED -> 2; AcFan.HIGH -> 3 }
        val b5 = 0xA1L
        val b4 = (mode or (fan shl 3) or ((if (s.power) 1 else 0) shl 7)).toLong()
        val b3 = (0x40 or ((clampTemp(this, s.temp) - 17) and 0x1F)).toLong()
        val v = (b5 shl 40) or (b4 shl 32) or (b3 shl 24) or (0xFFL shl 16) or (0xFFL shl 8)
        return v or checksum(v).toLong()
    }

    fun checksum(state: Long): Int {
        var sum = 0
        for (i in 1..5) sum += rev8(((state ushr (8 * i)) and 0xFF).toInt())
        return rev8((256 - (sum and 0xFF)) and 0xFF)
    }

    override fun encode(state: AcState, action: AcAction): IrPattern {
        var data = code(state, action)
        val b = PatternBuilder()
        for (pass in 0 until 2) {
            b.mark(HDR); b.space(HDR)
            b.bits(data and 0xFFFFFFFFFFFFL, 48, BIT_MARK, ONE_SPACE, BIT_MARK, ZERO_SPACE, msbFirst = true)
            b.mark(BIT_MARK); b.space(MIN_GAP)
            data = data.inv()
        }
        return IrPattern(38000, b.toArray())
    }
}

object VoltasAc : AcProtocol("voltas", "Voltas", "Voltas (India)") {
    private const val BIT_MARK = 1026
    private const val ONE_SPACE = 2553
    private const val ZERO_SPACE = 554

    fun state(s: AcState): IntArray {
        val raw = intArrayOf(0x33, 0x28, 0x00, 0x17, 0x3B, 0x3B, 0x3B, 0x11, 0x00, 0xCB)
        val mode = when (s.mode) { AcMode.FAN -> 1; AcMode.HEAT -> 2; AcMode.DRY -> 4; else -> 8 }
        var fan = when (s.fan) { AcFan.AUTO -> 7; AcFan.LOW -> 4; AcFan.MED -> 2; AcFan.HIGH -> 1 }
        if (s.mode == AcMode.FAN && fan == 7) fan = 1
        if (s.mode == AcMode.DRY) fan = 4
        val temp = if (s.mode == AcMode.DRY) 24 else clampTemp(this, s.temp)
        raw[1] = mode or (fan shl 5)
        raw[2] = (if (s.swing) 0b111 else 0) or ((if (s.turbo) 1 else 0) shl 5) or ((if (s.power) 1 else 0) shl 7)
        raw[3] = ((temp - 16) and 0x0F) or 0x10
        var sum = 0
        for (i in 0 until 9) sum += raw[i]
        raw[9] = sum.inv() and 0xFF
        return raw
    }

    override fun encode(state: AcState, action: AcAction): IrPattern {
        val d = state(state)
        val b = PatternBuilder()
        b.bytes(d, 0, 10, BIT_MARK, ONE_SPACE, BIT_MARK, ZERO_SPACE, msbFirst = true)
        b.mark(BIT_MARK); b.space(40_000)
        return IrPattern(38000, b.toArray())
    }
}

object AcProtocols {
    val all: List<AcProtocol> = listOf(KelvinatorAc, GreeAc, CoolixAc, MideaAc, VoltasAc)
    fun byId(id: String?): AcProtocol? = all.firstOrNull { it.id == id }
}
