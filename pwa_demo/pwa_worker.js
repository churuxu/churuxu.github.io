
/**
通用型PWA请求脚本


1. 每次请求直接从缓存返回

2. 请求manifest时，先本地返回，再触发从服务器请求

3. 服务器返回manifest，如果跟缓存不一致，则清除缓存


注册代码示例：

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('pwa_worker.js').then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });

 */




const cacheName = 'service_worker_cache'; //名称

const noCacheExp = new RegExp('/api/.+')

function log(msg) {
    console.log("[sw] " + msg);
}


//有缓存，并且请求manifest时
async function onRequestManifest(cacheResponse, request) {
    try {
        let response = await fetch(request);
        let fetchData = await response.text();
        let cacheData = await cacheResponse.text();
        if (fetchData != cacheData) { //跟缓存的不同
            //let cache = await caches.open(cacheName);
            log('manifest changed');            
            caches.delete(cacheName);            
        }
    } catch (error) {
        console.log(error);
    }
}


self.addEventListener('install', function (e) {
    log('install');
});


//实现自定义fetch函数
async function serviceWorkerFetch(request){
    let url = request.url;

    if (noCacheExp.test(url) || url.endsWith('pwa_worker.js')) { //不需要缓存
        log('no need cache:' + url);
        return await fetch(request);
    }
    //需要缓存  
    let cache = await caches.open(cacheName) 
    try {
        let cacheResponse = await cache.match(request);
        if(cacheResponse){
            log('match cache:' + url);
            if (url.endsWith('manifest.json')) {
                onRequestManifest(cacheResponse.clone(), request);
            }           
            return cacheResponse;
        }
    } catch (error) {
        console.log(error);
    }
    //未命中缓存, 从服务器请求，并保存响应
    log('request:' + url);
    let response = await fetch(request);    
    cache.put(request, response.clone());
    return response; 
}


self.addEventListener('fetch', (e) => {
    e.respondWith(serviceWorkerFetch(e.request));  
});
