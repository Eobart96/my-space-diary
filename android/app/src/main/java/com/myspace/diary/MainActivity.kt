package com.myspace.diary

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebSettings
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import com.myspace.sync.SyncEngine
import com.myspace.sync.SyncService

class MainActivity : AppCompatActivity() {
    
    private lateinit var webView: WebView
    private lateinit var syncEngine: SyncEngine
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Инициализируем WebView
        webView = WebView(this)
        setContentView(webView)
        
        // Настраиваем WebView
        setupWebView()
        
        // Запускаем синхронизацию
        setupSync()
        
        // Загружаем React приложение
        loadReactApp()
    }
    
    private fun setupWebView() {
        val webSettings = webView.settings
        webSettings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            setSupportZoom(true)
            builtInZoomControls = true
            displayZoomControls = false
            
            // Для локального хоста
            allowUniversalAccessFromFileURLs = true
            allowFileAccessFromFileURLs = true
            
            // Оптимизации
            cacheMode = WebSettings.LOAD_DEFAULT
            setAppCacheEnabled(true)
            setAppCachePath(cacheDir.absolutePath)
        }
        
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Вставляем JavaScript bridge для синхронизации
                injectSyncBridge()
            }
        }
    }
    
    private fun setupSync() {
        syncEngine = SyncEngine.getInstance(this)
        
        // Запускаем foreground service
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(Intent(this, SyncService::class.java).apply {
                action = SyncService.ACTION_START_SYNC
            })
        } else {
            startService(Intent(this, SyncService::class.java).apply {
                action = SyncService.ACTION_START_SYNC
            })
        }
        
        // Запускаем Go engine
        lifecycleScope.launch {
            val success = syncEngine.startEngine()
            if (success) {
                // Обновляем UI при изменениях
                monitorSyncStatus()
            }
        }
    }
    
    private fun loadReactApp() {
        // Загружаем локальное React приложение
        // В production это будет bundled файл
        webView.loadUrl("http://localhost:5173")
    }
    
    private fun injectSyncBridge() {
        // Добавляем JavaScript interface
        webView.addJavascriptInterface(AndroidSyncBridge(syncEngine), "AndroidSync")
        
        val bridgeScript = """
            window.MySpaceSync = {
                createEntry: function(data) {
                    return AndroidSync.createEntry(
                        data.id || 'entry_' + Date.now(),
                        data.title || '',
                        data.content || '',
                        data.date || new Date().toISOString().split('T')[0],
                        data.mood || 'neutral',
                        data.tags ? data.tags.join(',') : ''
                    );
                },
                
                updateEntry: function(id, data) {
                    return AndroidSync.updateEntry(id, JSON.stringify(data));
                },
                
                deleteEntry: function(id) {
                    return AndroidSync.deleteEntry(id);
                },
                
                getEntries: function() {
                    return JSON.parse(AndroidSync.getEntries());
                },
                
                getSyncStatus: function() {
                    return JSON.parse(AndroidSync.getSyncStatus());
                }
            };
            
            // Уведомляем React о готовности
            window.dispatchEvent(new Event('MySpaceSyncReady'));
        """
        
        webView.evaluateJavascript(bridgeScript, null)
    }
    
    private fun monitorSyncStatus() {
        lifecycleScope.launch {
            while (true) {
                try {
                    val status = syncEngine.getSyncStatus()
                    
                    // Обновляем WebView со статусом
                    webView.evaluateJavascript("""
                        if (window.updateSyncStatus) {
                            window.updateSyncStatus(${status.isRunning}, ${status.connections.size});
                        }
                    """.trimIndent(), null)
                    
                    kotlinx.coroutines.delay(5000) // Обновляем каждые 5 секунд
                } catch (e: Exception) {
                    kotlinx.coroutines.delay(10000) // При ошибке ждем дольше
                }
            }
        }
    }
    
    override fun onResume() {
        super.onResume()
        webView.onResume()
    }
    
    override fun onPause() {
        super.onPause()
        webView.onPause()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        webView.destroy()
        syncEngine.cleanup()
        
        // Останавливаем sync service
        stopService(Intent(this, SyncService::class.java).apply {
            action = SyncService.ACTION_STOP_SYNC
        })
    }
    
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
