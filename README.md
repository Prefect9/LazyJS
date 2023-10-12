# LazyJS ([Demo])[https://prefect9.github.io/LazyJS/demo/]
Mechanism for dynamic file loading

# Example code
```
var page = document.querySelector(".page")
var Push = function(text){
    var msg = document.createElement("div")
    msg.classList.add("message")
    msg.innerHTML = text
    page.append(msg)
    return msg
}
var Start = function(){
    Push("Start loading...")
    
    // Init using resources
    LazyJs.AddSource({ name: "data-test1", link: "test1.json" })
    LazyJs.AddSource({ name: "data-test2", link: "test2.json" })
    LazyJs.AddSource({ name: "data-test3", link: "test3.json" })
    
    // Load only test1.json and test2.json
    LazyJs.Load(["data-test1", "data-test2"])
        .then(function(){
            Push("Loaded Test1 & Test2").style.color = "#ff5d5d"
            
            // Loading test3.json after loading test1.json and test2.json
            return LazyJs.Load("data-test3")
        })
        .then(function(){
            Push("Loaded final Test3").style.color = "#04e423"
        })
        .catch(function(e){
            console.error(e)
        })
}()
```

### Version 1.01