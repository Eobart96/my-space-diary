package com.myspace.diary

import android.webkit.JavascriptInterface
import kotlinx.coroutines.runBlocking
import com.myspace.sync.SyncEngine
import org.json.JSONArray
import org.json.JSONObject

/**
 * JavaScript Interface для взаимодействия между WebView и Go sync engine
 */
class AndroidSyncBridge(private val syncEngine: SyncEngine) {
    
    @JavascriptInterface
    fun createEntry(id: String, title: String, content: String, date: String, mood: String, tags: String): Boolean {
        return try {
            val tagsList = if (tags.isNotEmpty()) {
                tags.split(",").map { it.trim() }
            } else {
                emptyList()
            }
            
            runBlocking {
                syncEngine.createDiaryEntry(id, title, content, date, mood, tagsList)
            }
        } catch (e: Exception) {
            false
        }
    }
    
    @JavascriptInterface
    fun updateEntry(id: String, dataJson: String): Boolean {
        return try {
            val data = JSONObject(dataJson)
            val title = data.optString("title", "")
            val content = data.optString("content", "")
            val date = data.optString("date", "")
            val mood = data.optString("mood", "")
            
            val tagsArray = data.optJSONArray("tags")
            val tagsList = if (tagsArray != null) {
                (0 until tagsArray.length()).map { tagsArray.getString(it) }
            } else {
                emptyList()
            }
            
            runBlocking {
                syncEngine.createDiaryEntry(id, title, content, date, mood, tagsList)
            }
        } catch (e: Exception) {
            false
        }
    }
    
    @JavascriptInterface
    fun deleteEntry(id: String): Boolean {
        return try {
            runBlocking {
                syncEngine.deleteDiaryEntry(id)
            }
        } catch (e: Exception) {
            false
        }
    }
    
    @JavascriptInterface
    fun getEntries(): String {
        return try {
            runBlocking {
                val entries = syncEngine.getDiaryEntries()
                val jsonArray = JSONArray()
                
                entries.forEach { entry ->
                    val entryJson = JSONObject().apply {
                        put("id", entry.id)
                        put("title", entry.title)
                        put("content", entry.content)
                        put("date", entry.date)
                        put("mood", entry.mood)
                        put("tags", JSONArray(entry.tags))
                        put("createdAt", entry.createdAt)
                        put("updatedAt", entry.updatedAt)
                    }
                    jsonArray.put(entryJson)
                }
                
                jsonArray.toString()
            }
        } catch (e: Exception) {
            "[]"
        }
    }
    
    @JavascriptInterface
    fun getSyncStatus(): String {
        return try {
            runBlocking {
                val status = syncEngine.getSyncStatus()
                JSONObject().apply {
                    put("isRunning", status.isRunning)
                    put("deviceName", status.deviceName)
                    put("connections", JSONArray(status.connections))
                    put("lastSyncTime", status.lastSyncTime)
                }.toString()
            }
        } catch (e: Exception) {
            """{"isRunning": false, "error": "${e.message}"}"""
        }
    }
}
