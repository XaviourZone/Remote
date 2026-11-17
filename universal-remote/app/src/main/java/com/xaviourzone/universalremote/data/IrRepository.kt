package com.xaviourzone.universalremote.data

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.util.zip.ZipInputStream

/**
 * Online code library. The index (≈9,000 remotes from Flipper-IRDB) comes from this
 * app's own GitHub repo (rebuilt weekly by a GitHub Action), every remote file is then
 * downloaded on demand and cached. The whole library can also be downloaded for offline use.
 */
class IrRepository(private val context: Context) {
    companion object {
        const val APP_REPO = "XaviourZone/Remote"
        val INDEX_URLS = listOf(
            "https://raw.githubusercontent.com/$APP_REPO/main/universal-remote/database/index.json",
            "https://cdn.jsdelivr.net/gh/$APP_REPO@main/universal-remote/database/index.json",
        )
        private const val INDEX_MAX_AGE_MS = 3L * 24 * 3600 * 1000
    }

    private val indexFile = File(context.filesDir, "index.json")
    private val cacheDir = File(context.filesDir, "ir_cache").apply { mkdirs() }
    val libraryDir = File(context.filesDir, "library")

    var lastIndexSource: String = ""
        private set

    suspend fun loadIndex(forceOnline: Boolean = false): RemoteIndex = withContext(Dispatchers.IO) {
        val fresh = indexFile.exists() && System.currentTimeMillis() - indexFile.lastModified() < INDEX_MAX_AGE_MS
        if (!forceOnline && fresh) {
            runCatching { RemoteIndex.parse(indexFile.readText()) }.getOrNull()?.let {
                lastIndexSource = "Saved copy"
                return@withContext it
            }
        }
        for (url in INDEX_URLS) {
            try {
                val text = httpGet(url)
                val idx = RemoteIndex.parse(text)
                if (idx.entries.isNotEmpty()) {
                    indexFile.writeText(text)
                    lastIndexSource = "Online"
                    return@withContext idx
                }
            } catch (_: Exception) {
            }
        }
        if (indexFile.exists()) {
            runCatching { RemoteIndex.parse(indexFile.readText()) }.getOrNull()?.let {
                lastIndexSource = "Saved copy (offline)"
                return@withContext it
            }
        }
        lastIndexSource = "Built-in copy (offline)"
        RemoteIndex.parse(context.assets.open("index.json").bufferedReader().use { it.readText() })
    }

    private fun encodePath(path: String): String =
        path.split('/').joinToString("/") { URLEncoder.encode(it, "UTF-8").replace("+", "%20") }

    private fun cacheFileFor(path: String) = File(cacheDir, path.replace(Regex("[^A-Za-z0-9._-]"), "_"))

    fun isOffline(path: String) = File(libraryDir, path).exists()

    /** Returns the .ir text for a database path (offline library -> cache -> network). */
    suspend fun fetchRemote(index: RemoteIndex, path: String): String = withContext(Dispatchers.IO) {
        val lib = File(libraryDir, path)
        if (lib.exists()) return@withContext lib.readText()
        val cached = cacheFileFor(path)
        if (cached.exists()) return@withContext cached.readText()
        val p = encodePath(path)
        val urls = listOf(
            "https://raw.githubusercontent.com/${index.source}/${index.ref}/$p",
            "https://cdn.jsdelivr.net/gh/${index.source}@${index.ref}/$p",
        )
        var last: Exception? = null
        for (u in urls) {
            try {
                val text = httpGet(u)
                cached.writeText(text)
                return@withContext text
            } catch (e: Exception) {
                last = e
            }
        }
        throw IOException("Could not download remote. Check internet connection.", last)
    }

    /** Download any .ir / Pronto / raw text from the web (GitHub page links are converted to raw). */
    suspend fun fetchUrl(url: String): String = withContext(Dispatchers.IO) {
        var u = url.trim()
        val blob = Regex("https?://github\\.com/([^/]+)/([^/]+)/blob/(.+)").matchEntire(u)
        if (blob != null) {
            val (owner, repo, rest) = blob.destructured
            u = "https://raw.githubusercontent.com/$owner/$repo/$rest"
        }
        httpGet(u)
    }

    /** Downloads the whole Flipper-IRDB as a zip and keeps every .ir file for offline use. */
    suspend fun downloadLibrary(index: RemoteIndex, progress: (String) -> Unit): Int = withContext(Dispatchers.IO) {
        val url = "https://codeload.github.com/${index.source}/zip/refs/heads/${index.ref}"
        val tmp = File(context.cacheDir, "library_new").apply { deleteRecursively(); mkdirs() }
        var count = 0
        val conn = open(url)
        try {
            ZipInputStream(conn.inputStream.buffered()).use { zip ->
                while (true) {
                    val e = zip.nextEntry ?: break
                    if (!e.isDirectory && e.name.endsWith(".ir", ignoreCase = true)) {
                        // Strip the "Flipper-IRDB-main/" prefix.
                        val rel = e.name.substringAfter('/')
                        if (rel.contains("..")) continue
                        val out = File(tmp, rel)
                        out.parentFile?.mkdirs()
                        out.outputStream().use { zip.copyTo(it) }
                        count++
                        if (count % 200 == 0) withContext(Dispatchers.Main) { progress("Saved $count remotes…") }
                    }
                }
            }
        } finally {
            conn.disconnect()
        }
        if (count == 0) throw IOException("Download was empty")
        libraryDir.deleteRecursively()
        if (!tmp.renameTo(libraryDir)) {
            tmp.copyRecursively(libraryDir, overwrite = true)
            tmp.deleteRecursively()
        }
        count
    }

    fun libraryCount(): Int = if (!libraryDir.exists()) 0 else libraryDir.walkTopDown().count { it.isFile }

    fun deleteLibrary() { libraryDir.deleteRecursively() }

    fun clearCache() { cacheDir.deleteRecursively(); cacheDir.mkdirs() }

    private fun open(url: String): HttpURLConnection {
        var current = url
        repeat(5) {
            val c = URL(current).openConnection() as HttpURLConnection
            c.connectTimeout = 15_000
            c.readTimeout = 60_000
            c.instanceFollowRedirects = true
            c.setRequestProperty("User-Agent", "UniversalRemote-Android")
            val code = c.responseCode
            if (code in 300..399) {
                current = c.getHeaderField("Location") ?: throw IOException("Bad redirect")
                c.disconnect()
                return@repeat
            }
            if (code != 200) {
                c.disconnect()
                throw IOException("HTTP $code for $current")
            }
            return c
        }
        throw IOException("Too many redirects")
    }

    private fun httpGet(url: String): String {
        val c = open(url)
        try {
            return c.inputStream.bufferedReader().use { it.readText() }
        } finally {
            c.disconnect()
        }
    }
}
