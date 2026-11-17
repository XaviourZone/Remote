package com.xaviourzone.universalremote.data

import org.json.JSONObject

data class IndexEntry(
    val path: String,
    val category: String,
    val brandKey: String,
    val model: String,
    val buttons: Int,
    val testButton: String,
    val converted: Boolean,
)

data class BrandCount(val key: String, val name: String, val count: Int)

/** Categories shown first, with friendly names. Everything else is still listed under "More devices". */
object Categories {
    data class Info(val id: String, val label: String, val emoji: String)

    val featured = listOf(
        Info("TVs", "TV", "📺"),
        Info("ACs", "Air conditioner", "❄️"),
        Info("Cable_Boxes", "Set-top box / DTH", "📡"),
        Info("Fans", "Fan / Cooler", "🌀"),
        Info("Projectors", "Projector", "📽️"),
        Info("SoundBars", "Soundbar", "🔊"),
        Info("Audio_and_Video_Receivers", "Audio / AV receiver", "🎚️"),
        Info("Streaming_Devices", "Streaming box", "📦"),
        Info("LED_Lighting", "LED lights", "💡"),
        Info("DVD_Players", "DVD / Blu-ray", "💿"),
        Info("Speakers", "Speakers", "🎵"),
        Info("Heaters", "Heater", "🔥"),
        Info("Air_Purifiers", "Air purifier", "🌬️"),
        Info("Cameras", "Camera", "📷"),
    )

    fun label(id: String): String = featured.firstOrNull { it.id == id }?.label
        ?: if (id == "Miscellaneous") "Other devices" else id.replace('_', ' ')

    fun emoji(id: String): String = featured.firstOrNull { it.id == id }?.emoji ?: "🔘"
}

class RemoteIndex(
    val source: String,
    val ref: String,
    val generated: String,
    private val brandNames: Map<String, String>,
    val entries: List<IndexEntry>,
) {
    fun brandName(key: String): String = brandNames[key] ?: key

    val categories: List<Pair<String, Int>> by lazy {
        entries.groupingBy { it.category }.eachCount().toList().sortedByDescending { it.second }
    }

    fun brandsIn(category: String?): List<BrandCount> {
        val list = if (category == null) entries else entries.filter { it.category == category }
        return list.groupingBy { it.brandKey }.eachCount()
            .map { (k, c) -> BrandCount(k, brandName(k), c) }
            .sortedBy { it.name.lowercase() }
    }

    /** Files for a brand: exact category first, then the brand's uncategorised files, then the rest. */
    fun filesFor(category: String?, brandKey: String): List<IndexEntry> {
        val brand = entries.filter { it.brandKey == brandKey }
        if (category == null) return brand
        val primary = brand.filter { it.category == category }
        val misc = brand.filter { it.category == "Miscellaneous" && it.category != category }
        return primary + misc
    }

    fun inCategory(category: String): List<IndexEntry> = entries.filter { it.category == category }

    fun search(query: String, limit: Int = 300): List<IndexEntry> {
        val tokens = query.lowercase().split(Regex("\\s+")).filter { it.isNotBlank() }
        if (tokens.isEmpty()) return emptyList()
        val scored = ArrayList<Pair<IndexEntry, Int>>()
        for (e in entries) {
            val brand = brandName(e.brandKey).lowercase()
            val hay = "$brand ${e.brandKey} ${e.model.lowercase()} ${Categories.label(e.category).lowercase()} ${e.category.lowercase()}"
            val compact = hay.replace(Regex("[^a-z0-9]"), "")
            var score = 0
            var ok = true
            for (t in tokens) {
                val ct = t.replace(Regex("[^a-z0-9]"), "")
                when {
                    brand == t || e.brandKey == ct -> score += 10
                    hay.contains(t) -> score += 4
                    ct.isNotEmpty() && compact.contains(ct) -> score += 2
                    else -> { ok = false; break }
                }
            }
            if (ok) scored.add(e to score - (if (e.converted) 1 else 0))
        }
        return scored.sortedByDescending { it.second }.take(limit).map { it.first }
    }

    companion object {
        fun parse(json: String): RemoteIndex {
            val o = JSONObject(json)
            val brands = HashMap<String, String>()
            o.optJSONObject("brands")?.let { b -> b.keys().forEach { k -> brands[k] = b.getString(k) } }
            val arr = o.getJSONArray("files")
            val list = ArrayList<IndexEntry>(arr.length())
            for (i in 0 until arr.length()) {
                val r = arr.getJSONArray(i)
                list.add(
                    IndexEntry(
                        path = r.getString(0), category = r.getString(1), brandKey = r.getString(2),
                        model = r.getString(3), buttons = r.optInt(4), testButton = r.optString(5),
                        converted = r.optInt(6) == 1,
                    )
                )
            }
            return RemoteIndex(
                o.optString("source", "Lucaslhm/Flipper-IRDB"), o.optString("ref", "main"),
                o.optString("generated", ""), brands, list,
            )
        }
    }
}
