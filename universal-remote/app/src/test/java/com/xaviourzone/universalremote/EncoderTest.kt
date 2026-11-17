package com.xaviourzone.universalremote

import com.xaviourzone.universalremote.data.RemoteIndex
import com.xaviourzone.universalremote.ir.AcFan
import com.xaviourzone.universalremote.ir.AcMode
import com.xaviourzone.universalremote.ir.AcState
import com.xaviourzone.universalremote.ir.CoolixAc
import com.xaviourzone.universalremote.ir.FlipperIr
import com.xaviourzone.universalremote.ir.FlipperProtocols
import com.xaviourzone.universalremote.ir.GreeAc
import com.xaviourzone.universalremote.ir.IrEncoder
import com.xaviourzone.universalremote.ir.IrSignal
import com.xaviourzone.universalremote.ir.KelvinatorAc
import com.xaviourzone.universalremote.ir.MideaAc
import com.xaviourzone.universalremote.ir.Pronto
import com.xaviourzone.universalremote.ir.VoltasAc
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/** Reference vectors come from the IRremoteESP8266 unit tests (captured from real remotes). */
class EncoderTest {
    private fun str(t: IntArray) = t.withIndex().joinToString("") { (i, v) -> (if (i % 2 == 0) "m" else "s") + v }

    @Test
    fun kelvinatorMatchesReference() {
        val st = KelvinatorAc.state(
            AcState(power = true, mode = AcMode.COOL, temp = 27, fan = AcFan.LOW, swing = false),
            light = false, ion = true, xFan = true, swingH = true,
        )
        val expected = "m9010s4505" +
            "m680s1530m680s510m680s510m680s1530m680s1530m680s510m680s1530m680s510" +
            "m680s1530m680s1530m680s510m680s1530m680s510m680s510m680s510m680s510" +
            "m680s510m680s510m680s510m680s510m680s510m680s510m680s1530m680s1530" +
            "m680s510m680s510m680s510m680s510m680s1530m680s510m680s1530m680s510" +
            "m680s510m680s1530m680s510" +
            "m680s19975" +
            "m680s510m680s510m680s510m680s510m680s1530m680s510m680s510m680s510" +
            "m680s510m680s510m680s510m680s510m680s510m680s510m680s510m680s510" +
            "m680s510m680s510m680s510m680s510m680s510m680s510m680s510m680s510" +
            "m680s510m680s510m680s510m680s510m680s1530m680s1530m680s1530m680s1530" +
            "m680s39950" +
            "m9010s4505" +
            "m680s1530m680s510m680s510m680s1530m680s1530m680s510m680s1530m680s510" +
            "m680s1530m680s1530m680s510m680s1530m680s510m680s510m680s510m680s510" +
            "m680s510m680s510m680s510m680s510m680s510m680s510m680s1530m680s1530" +
            "m680s510m680s510m680s510m680s510m680s1530m680s1530m680s1530m680s510" +
            "m680s510m680s1530m680s510" +
            "m680s19975" +
            "m680s510m680s510m680s510m680s510m680s510m680s510m680s510m680s510" +
            "m680s510m680s510m680s510m680s510m680s510m680s510m680s510m680s510" +
            "m680s510m680s510m680s510m680s510m680s1530m680s510m680s510m680s510" +
            "m680s510m680s510m680s510m680s510m680s1530m680s1530m680s1530m680s1530" +
            "m680s39950"
        assertEquals(expected, str(KelvinatorAc.encodeRaw(st).timings))
    }

    @Test
    fun greeMatchesReference() {
        val st = GreeAc.state(AcState(power = true, mode = AcMode.COOL, temp = 23, fan = AcFan.LOW, swing = true))
        assertArrayEquals(intArrayOf(0x59, 0x07, 0x60, 0x50, 0x01, 0x20, 0x00, 0xC0), st)
    }

    @Test
    fun coolixDefaultState() {
        assertEquals(0xB21FC8L, CoolixAc.code(AcState(power = true, mode = AcMode.AUTO, temp = 25), com.xaviourzone.universalremote.ir.AcAction.STATE))
        assertEquals(CoolixAc.OFF, CoolixAc.code(AcState(power = false), com.xaviourzone.universalremote.ir.AcAction.STATE))
    }

    @Test
    fun voltasDryState() {
        val st = VoltasAc.state(AcState(power = true, mode = AcMode.DRY, temp = 30, fan = AcFan.HIGH))
        // Reference: 0x33, 0x84, 0x88, 0x18 ... (that capture also has the WiFi bit 0x08 set)
        assertEquals(0x84, st[1])
        assertEquals(0x80, st[2])
        assertEquals(0x18, st[3])
        var sum = 0
        for (i in 0 until 9) sum += st[i]
        assertEquals(sum.inv() and 0xFF, st[9])
    }

    @Test
    fun mideaChecksum() {
        assertEquals(0x62, MideaAc.checksum(0xA1826FFFFF62L))
        assertEquals(0x70, MideaAc.checksum(0xA18177FFFF70L))
    }

    @Test
    fun necFrame() {
        val p = IrEncoder.encode(IrSignal.Parsed("NEC", 0x04, 0x08))!!
        assertEquals(38000, p.frequency)
        assertEquals(9000, p.timings[0]); assertEquals(4500, p.timings[1])
        // 32 bits + stop mark + trailing gap
        assertEquals(2 + 64 + 1 + 1, p.timings.size)
        // address 0x04 LSB first: 0,0,1,0,...
        assertEquals(560, p.timings[3]); assertEquals(560, p.timings[5]); assertEquals(1690, p.timings[7])
        // total frame period 110 ms
        assertEquals(110_000L, p.timings.sumOf { it.toLong() })
    }

    @Test
    fun everyProtocolEncodes() {
        for (proto in FlipperProtocols.supported) {
            val p = IrEncoder.encode(IrSignal.Parsed(proto, 0x01, 0x02))
            assertNotNull(proto, p)
            assertTrue(proto, p!!.timings.all { it > 0 })
            assertTrue(proto, p.timings.size % 2 == 0 || p.timings.size > 3)
        }
    }

    @Test
    fun flipperRoundTrip() {
        val text = """
            Filetype: IR signals file
            Version: 1
            #
            name: Power
            type: parsed
            protocol: NECext
            address: 00 7F 00 00
            command: 15 EA 00 00
            #
            name: Vol_up
            type: raw
            frequency: 38000
            duty_cycle: 0.330000
            data: 9024 4512 579 552 579
        """.trimIndent()
        val b = FlipperIr.parse(text)
        assertEquals(2, b.size)
        assertEquals(IrSignal.Parsed("NECext", 0x7F00, 0xEA15), b[0].signal)
        val again = FlipperIr.parse(FlipperIr.serialize(b))
        assertEquals(b, again)
    }

    @Test
    fun prontoParses() {
        val p = Pronto.parse("0000 006D 0002 0000 0157 00AB 0015 0015")
        assertNotNull(p)
        assertEquals(4, p!!.timings.size)
    }

    @Test
    fun bundledIndexParses() {
        val f = listOf(File("../database/index.json"), File("database/index.json")).first { it.exists() }
        val idx = RemoteIndex.parse(f.readText())
        assertTrue(idx.entries.size > 5000)
        assertTrue(idx.brandsIn("TVs").any { it.key == "tcl" })
        assertTrue(idx.search("tcl tv").isNotEmpty())
    }

    @Test
    fun realDatabaseFilesEncode() {
        // Every parsed signal in a sample of real files must encode.
        val dir = File(System.getenv("IRDB_DIR") ?: return)
        var n = 0
        dir.walkTopDown().filter { it.extension == "ir" }.take(3000).forEach { file ->
            for (btn in FlipperIr.parse(file.readText())) {
                assertNotNull("${file.path} ${btn.name}", IrEncoder.encode(btn.signal))
                n++
            }
        }
        assertTrue(n > 1000)
    }
}
