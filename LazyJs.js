/*
    Version: 1.02
    Author: Мистер Мир
    Tg: @it_dev9
*/
var LazyJsError = function(text){
    var that = this
    that.text = text
}
var LazyJsSource = function(source){
    var that = this
    
    if(typeof source.name != "string") throw new LazyJsError("Введите название ресурса")
    if(typeof source.link != "string") throw new LazyJsError("Введите ссылку на ресурс")
    
    that.name = source.name
    that.link = source.link
    that.loaded = false
    that.loadedData = false
    that.onLoad = null
    that.data = null // данные загруженного ресурса
    that.type = null
    var startedLoad = false,
        dom = null
    
    var extension = null
    if(extension = /^(.*?(\.[a-z0-9]*?))(\?.*)?$/i.exec(that.link)) extension = extension[2].toLowerCase()
    
    switch(extension){
        case ".js":
            that.type = "script"
            break
        case ".css":
            that.type = "styles"
            break
        case ".webp":
        case ".png":
        case ".jpg":
        case ".jpeg":
            that.type = "image"
            break
        default:
            that.type = "data"
            break
    }
    
    var Load = function(){
        if(startedLoad || that.loaded) return
        startedLoad = true
        
        switch(that.type){
            case "script":
                var script = document.createElement("script")
                script.type = "text/javascript"
                script.src = that.link
                script.onload = function(){
                    that.data = true
                    that.loaded = true
                    that.loadedData = true
                    startedLoad = false
                    that.onLoad(that)
                }
                script.onerror = function(){
                    that.loaded = false
                    throw new LazyJsError("Ошибка загрузки ресурса "+that.name)
                }
                dom = script
                document.querySelector("body").append(script)
                break
            case "styles":
                var link = document.createElement("link")
                link.rel = "stylesheet"
                link.type = "text/css"
                link.href = that.link
                link.onload = function(){
                    that.data = true
                    that.loaded = true
                    that.loadedData = true
                    startedLoad = false
                    that.onLoad(that)
                }
                link.onerror = function(){
                    that.loaded = false
                    throw new LazyJsError("Ошибка загрузки ресурса "+that.name)
                }
                dom = link
                document.querySelector("head").append(link)
                break
            case "image":
                var image = new Image()
                image.onload = function () {
                    that.data = true
                    that.loaded = true
                    that.loadedData = true
                    startedLoad = false
                    that.onLoad(that)
                }
                image.onerror = function(){
                    that.loaded = false
                    throw new LazyJsError("Ошибка загрузки ресурса "+that.name)
                }
                image.src = that.link
                break
            case "data":
                var xhr = new XMLHttpRequest()
                xhr.open('GET', that.link)
                xhr.onload = function(){
                    if(xhr.status != 200) throw new LazyJsError("Ошибка загрузки ресурса "+that.name)
                    else{
                        that.data = xhr.response
                        that.loaded = true
                        that.loadedData = true
                        startedLoad = false
                        that.onLoad(that)
                    }
                }
                xhr.onerror = function(){
                    throw new LazyJsError("Ошибка загрузки ресурса "+that.name)
                }
                xhr.send()
                break
        }
    }
    that.Load = Load
}
var LazyJsPoolSources = function(){
    var that = this,
        sources = [],
        handlers = []
    
    var Is = function(name){
        var isset = false
        for(var source of sources){
            if(source.name == name){
                isset = true
                break
            }
        }
        return isset
    }
    that.Is = Is
    
    var Get = function(name){
        var result = null
        for(var source of sources){
            if(source.name == name){
                result = source
                break
            }
        }
        return result
    }
    that.Get = Get
    
    var Add = function(source){
        source = new LazyJsSource(source)
        source.onLoad = LoadedSource
        sources.push(source)
    }
    that.Add = Add
    
    var AddWait = function(handler){
        handlers.push(handler)
        if(handler()) RemoveWait(handler)
    }
    var RemoveWait = function(handler){
        for(var i = 0; i < handlers.length; i++){
            if(handler == handlers[i]){
                handlers.splice(i, 1)
                break
            }
        }
    }
    that.Wait = AddWait
    
    var LoadedSource = function(source){
        for(var handler of handlers){
            if(handler()) RemoveWait(handler)
        }
    }
}
var LazyJs = function(){
    var that = this,
        pool = new LazyJsPoolSources()
    
    that.AddSource = function(...args){
        if(args.length == 2 && typeof args[0] == "string" && typeof args[1] == "string") pool.Add({ name: args[0], link: args[1] })
        else if(args.length == 1 && typeof args[0] == "string") pool.Add({ name: args[0], link: args[0] })
        else if(args.length == 1 && typeof args[0] == "object") pool.Add(args[0])
        else throw new LazyJsError("Invalid source arguments")
    }
    that.AddSources = function(sources){
        for(var source in sources) pool.Add(source)
    }
    
    var GetPromiseSource = function(sourceName){
        return new Promise(function(resolve, reject){
            // проверка на существование source
            if(!pool.Is(sourceName)) throw new LazyJsError("Ресурс "+sourceName+" не инициализирован")
            
            // создание слушателя
            var Wait = function(){
                if(pool.Get(sourceName).loaded){
                    resolve()
                    return true
                }else return false
            }
            pool.Wait(Wait)
            
            // начинаю загрузку требуемого ресурса
            pool.Get(sourceName).Load()
        })
    }
    var GetPromiseSources = function(sourcesNamesArray){
        return new Promise(function(resolve, reject){
            // проверка на существование ресурсов
            for(var sourceName of sourcesNamesArray)
                if(!pool.Is(sourceName)) throw new LazyJsError("Ресурс "+sourceName+" не инициализирован")
            
            // создание слушателя
            var Wait = function(){
                var loaded = true
                for(var sourceName of sourcesNamesArray){
                    if(!pool.Get(sourceName).loaded){
                        loaded = false
                        break
                    }
                }
                if(loaded) resolve()
                return loaded
            }
            pool.Wait(Wait)
            
            // начинаю загрузку требуемых ресурсов
            for(var sourceName of sourcesNamesArray)
                pool.Get(sourceName).Load()
        })
    }
    var Load = function(list){
        
        var promise
        
        if(typeof list == "string") promise = GetPromiseSource(list)
        else if(typeof list == "object" && list.constructor.name == "Array") promise = GetPromiseSources(list)
        else throw new Error("Передан неверный тип списка ресурсов")
        
        return promise
    }
    that.Load = Load
    
    that.Get = pool.Get
}
window.LazyJs = new LazyJs()