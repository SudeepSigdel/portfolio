window.addEventListener("load", displayName)

function displayName(){
    const content = "hi, i'm sudeep."
    const length = content.length
    const span = document.getElementById("name")
    let i = 0;
    const interval = setInterval(()=>{
    if(i<length){
        span.textContent += `${content[i]}`
        i++;}
    else{
        clearInterval(interval);
    }
    }, 100)
    return
};