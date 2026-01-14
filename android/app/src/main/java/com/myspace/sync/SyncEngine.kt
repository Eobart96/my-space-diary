package com.myspace.sync

import android.content.Context
import android.os.Build
import androidx.annotation.RequiresApi
import kotlinx.coroutines.*
import java.io.File
import java.util.concurrent.Executors

/**
 * JNI Bridge для Go sync engine
 * 
 * Этот класс обеспечивает взаимодействие между Kotlin кодом и Go библиотекой,
 * скомпилированной в .so файл.
 */
class SyncEngine private constructor(
    private val context: Context,
    private val dataDir: File,
    private val deviceName: String
) {
    
    private val executor = Executors.newSingleThreadExecutor()
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    companion object {
        // Загрузка Go библиотеки
        init {
            System.loadLibrary("myspace-sync")
        }
        
        @Volatile
        private var INSTANCE: SyncEngine? = null
        
        fun getInstance(context: Context): SyncEngine {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: createInstance(context).also { INSTANCE = it }
            }
        }
        
        private fun createInstance(context: Context): SyncEngine {
            val dataDir = File(context.filesDir, "sync_data")
            val deviceName = "${Build.MANUFACTURER}_${Build.MODEL}_${Build.ID}"
                .replace(Regex("[^a-zA-Z0-9_-]"), "_")
                .lowercase()
            
            return SyncEngine(context, dataDir, deviceName)
        }
    }
    
    /**
     * Запускает Go sync engine
     */
    @RequiresApi(Build.VERSION_CODES.O)
    fun startEngine(): Boolean {
        return try {
            // Создаем директорию для данных
            if (!dataDir.exists()) {
                dataDir.mkdirs()
            }
            
            // Запускаем Go engine в отдельном потоке
            executor.submit {
                try {
                    startGoEngine(
                        dataDir.absolutePath,
                        deviceName
                    )
                } catch (e: Exception) {
                    // Логируем ошибку
                    android.util.Log.e("SyncEngine", "Failed to start Go engine", e)
                }
            }
            
            true
        } catch (e: Exception) {
            android.util.Log.e("SyncEngine", "Failed to start engine", e)
            false
        }
    }
    
    /**
     * Останавливает Go sync engine
     */
    fun stopEngine() {
        try {
            stopGoEngine()
        } catch (e: Exception) {
            android.util.Log.e("SyncEngine", "Failed to stop engine", e)
        }
    }
    
    /**
     * Получает статус синхронизации
     */
    suspend fun getSyncStatus(): SyncStatus = withContext(Dispatchers.IO) {
        try {
            val statusJson = getEngineStatus()
            // Парсим JSON (в реальном коде использовать Gson/Moshi)
            SyncStatus(
                deviceName = deviceName,
                isRunning = true,
                connections = parseConnections(statusJson),
                lastSyncTime = System.currentTimeMillis()
            )
        } catch (e: Exception) {
            android.util.Log.e("SyncEngine", "Failed to get status", e)
            SyncStatus(
                deviceName = deviceName,
                isRunning = false,
                connections = emptyList(),
                lastSyncTime = 0
            )
        }
    }
    
    /**
     * Создает запись в дневнике
     */
    suspend fun createDiaryEntry(
        id: String,
        title: String,
        content: String,
        date: String,
        mood: String,
        tags: List<String>
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val data = mapOf(
                "title" to title,
                "content" to content,
                "date" to date,
                "mood" to mood,
                "tags" to tags
            )
            
            createRecord("diary_entries", id, data)
            true
        } catch (e: Exception) {
            android.util.Log.e("SyncEngine", "Failed to create diary entry", e)
            false
        }
    }
    
    /**
     * Получает все записи дневника
     */
    suspend fun getDiaryEntries(): List<DiaryEntry> = withContext(Dispatchers.IO) {
        try {
            val entriesJson = getAllRecords("diary_entries")
            // Парсим JSON в список DiaryEntry
            parseDiaryEntries(entriesJson)
        } catch (e: Exception) {
            android.util.Log.e("SyncEngine", "Failed to get diary entries", e)
            emptyList()
        }
    }
    
    /**
     * Удаляет запись из дневника
     */
    suspend fun deleteDiaryEntry(id: String): Boolean = withContext(Dispatchers.IO) {
        try {
            deleteRecord("diary_entries", id)
            true
        } catch (e: Exception) {
            android.util.Log.e("SyncEngine", "Failed to delete diary entry", e)
            false
        }
    }
    
    // JNI методы для взаимодействия с Go
    
    /**
     * Запускает Go sync engine
     */
    private external fun startGoEngine(dataDir: String, deviceName: String)
    
    /**
     * Останавливает Go sync engine
     */
    private external fun stopGoEngine()
    
    /**
     * Получает статус engine в формате JSON
     */
    private external fun getEngineStatus(): String
    
    /**
     * Создает запись в указанной таблице
     */
    private external fun createRecord(table: String, id: String, data: Map<String, Any>): Boolean
    
    /**
     * Получает все записи из таблицы в формате JSON
     */
    private external fun getAllRecords(table: String): String
    
    /**
     * Удаляет запись из таблицы
     */
    private external fun deleteRecord(table: String, id: String): Boolean
    
    // Вспомогательные методы для парсинга JSON
    
    private fun parseConnections(statusJson: String): List<String> {
        // В реальном коде использовать JSON парсер
        return emptyList()
    }
    
    private fun parseDiaryEntries(entriesJson: String): List<DiaryEntry> {
        // В реальном коде использовать JSON парсер
        return emptyList()
    }
    
    /**
     * Очищает ресурсы
     */
    fun cleanup() {
        scope.cancel()
        executor.shutdown()
        stopEngine()
    }
}

// Data классы для представления данных

data class SyncStatus(
    val deviceName: String,
    val isRunning: Boolean,
    val connections: List<String>,
    val lastSyncTime: Long
)

data class DiaryEntry(
    val id: String,
    val title: String,
    val content: String,
    val date: String,
    val mood: String,
    val tags: List<String>,
    val createdAt: Long,
    val updatedAt: Long
)
