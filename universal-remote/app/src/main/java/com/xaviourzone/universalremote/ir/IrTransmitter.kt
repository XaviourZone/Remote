package com.xaviourzone.universalremote.ir

import android.content.Context
import android.hardware.ConsumerIrManager
import android.util.Log
import java.util.concurrent.Executors

/** Thin wrapper around Android's ConsumerIrManager (the phone's IR blaster). */
class IrTransmitter(context: Context) {
    private val manager: ConsumerIrManager? =
        context.getSystemService(Context.CONSUMER_IR_SERVICE) as? ConsumerIrManager
    private val executor = Executors.newSingleThreadExecutor()

    val available: Boolean = try { manager?.hasIrEmitter() == true } catch (e: Exception) { false }

    val frequencyRanges: List<IntRange> = try {
        manager?.carrierFrequencies?.map { it.minFrequency..it.maxFrequency } ?: emptyList()
    } catch (e: Exception) { emptyList() }

    var lastError: String? = null
        private set

    private fun fitFrequency(f: Int): Int {
        if (frequencyRanges.isEmpty() || frequencyRanges.any { f in it }) return f
        // Pick the closest supported frequency.
        return frequencyRanges.map { r -> f.coerceIn(r.first, r.last) }.minByOrNull { kotlin.math.abs(it - f) } ?: f
    }

    /** Sends asynchronously, in order. Returns false if no IR blaster is present. */
    fun send(pattern: IrPattern?, onDone: ((Boolean) -> Unit)? = null): Boolean {
        val m = manager
        if (pattern == null || m == null || !available) {
            lastError = if (pattern == null) "Unsupported signal" else "No IR blaster found"
            onDone?.invoke(false)
            return false
        }
        val timings = sanitize(pattern.timings)
        if (timings.isEmpty()) { onDone?.invoke(false); return false }
        executor.execute {
            val ok = try {
                m.transmit(fitFrequency(pattern.frequency), timings)
                true
            } catch (e: Exception) {
                Log.w("IrTransmitter", "transmit failed", e)
                lastError = e.message
                false
            }
            onDone?.invoke(ok)
        }
        return true
    }

    fun send(signal: IrSignal, onDone: ((Boolean) -> Unit)? = null): Boolean = send(IrEncoder.encode(signal), onDone)

    companion object {
        /** Android rejects patterns longer than 2 seconds and needs an even, positive list. */
        fun sanitize(input: IntArray): IntArray {
            val out = ArrayList<Int>(input.size)
            var total = 0L
            for (v in input) {
                if (v <= 0) continue
                val value = v.coerceAtMost(200_000)
                if (total + value > 1_900_000) break
                out.add(value)
                total += value
            }
            if (out.size % 2 == 1) out.add(1_000)
            return out.toIntArray()
        }
    }
}
