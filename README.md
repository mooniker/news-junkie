```
███    ██ ███████ ██     ██ ███████
████   ██ ██      ██     ██ ██     
██ ██  ██ █████   ██  █  ██ ███████ █████
██  ██ ██ ██      ██ ███ ██      ██
██   ████ ███████  ███ ███  ███████

     ██ ██    ██ ███    ██ ██   ██ ██ ███████
     ██ ██    ██ ████   ██ ██  ██  ██ ██     
     ██ ██    ██ ██ ██  ██ █████   ██ █████ 
██   ██ ██    ██ ██  ██ ██ ██  ██  ██ ██    
 █████   ██████  ██   ████ ██   ██ ██ ███████
```

```js
const newsJunkie = require('news-junkie')

;(async () => {
  const data = await newsJunkie({ date: 20201104 })

  const json = JSON.stringify(data, null, 2)
  console.log(json)
})()
```
