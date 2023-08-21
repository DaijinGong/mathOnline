const { log } = require('console');
const express = require('express');
const fs = require('fs')
const app = express();
const mongoose = require('mongoose')

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
let dburl = 'mongodb://localhost:27017'
mongoose.connect(dburl,{useMongoClient:true})

async function dbConnect(){
    await client.connect()
    console.log('db conect successfully')
    const db = client.db('firstDB')
    const collection = db.collection('firstDoc')
    console.log('db set successfully')
    return 'done'
}
dbConnect().then(console.log('function finish'))

let newQuestion
let gradeCorrectNum = 0
let gradeTotalNum = 0
let flag = "normal"//"normal" "wrong"
const path = flag=='normal'?'questions.json':'wrongQuestions.json';
//这里可以通过增加或者删减符号，控制题目类型
let arrStr = ['÷']//['+','-','x','÷']

//第一次生成后，除非完成题目，否则题目不刷新。但是多次访问可以有反馈
let finish = true //提交答案完成判断并写入后，变为true，get请求只有为true才刷新题目，并重置为flase

//初始化确定之前的数据
checkDir = fs.existsSync("questions.json");
if(checkDir){
    fs.readFile("questions.json","utf-8",function(error,data){   
        if(error){
            throw error
        }else{
            obj = JSON.parse(data)
            // console.log(obj[obj.length-1])
            gradeCorrectNum = obj[obj.length-1]["correctNum"]
            gradeTotalNum = obj[obj.length-1]["totalNum"]
            console.log( gradeCorrectNum, gradeTotalNum)
        }
        // console.log(data.toString());
     });
}

// 生成题目的函数
function generateQuestion() {
  // 在这里生成一个随机的小学加减乘除题目
    let one = Math.floor((Math.random() * 100) + 1);
    let two =  Math.floor((Math.random() * 10) + 1);
    one = one>=100?one:one+100
    // two = two>=10?two:two+10
   
    let type = arrStr[Math.floor(Math.random() * arrStr.length)];
    if(type=='-' || type=='÷'){
        big = one>=two?one:two
        small = one<two?one:two
        one = big
        two = small
    }
    return {"question":one+type+two+'=',"type":type,"one":one,"two":two,'correctNum':gradeCorrectNum,'totalNum':gradeTotalNum}
  }

  //要刷新一次，重置错题正确数量
let wrongArray = getWrongQuestionInfo()
let correctWrongNum = 0
function getWrongQuestionInfo() {
    checkDir = fs.existsSync("questions.json");
    if(checkDir){
        fs.readFile("questions.json","utf-8",function(error,data){   
            if(error){
                throw error
            }else{
                let obj2 = JSON.parse(data)
                // console.log(obj[obj.length-1])
                wrongArray = obj2.filter((item)=>!item.correct)
                // console.log(wrongArray)
                return wrongArray
            }
        // console.log(data.toString());
        });
    }
    return 0
}
function generateWrongQuestion(i) {
    // 在这里生成一个随机的小学加减乘除题目
    if(!wrongArray) return 0
    let one = wrongArray[i].one
    let two =  wrongArray[i].two
    let type = wrongArray[i].type
    let question = wrongArray[i].question
    return {"question":question,"type":type,"one":one,"two":two,'correctNum':gradeCorrectNum,'totalNum':gradeTotalNum}
}
  
let check = (one,two,type,res1,res2)=>{
    if(type=='+'){
        return parseInt(one)+parseInt(two)==res1
    }
    if(type=='-'){
        return parseInt(one)-parseInt(two)==res1
    }
    if(type=='x'){
        return parseInt(one)*parseInt(two)==res1
    }
    if(type=='÷'){
        return parseInt(parseInt(one)/parseInt(two))==res1 && parseInt(one)%parseInt(two)==res2
    }
}

let i=0
let caculateWrongNum = 0
let wrongGet = ()=>{
    if(finish){
        if(i<wrongArray.length){
            newQuestion = generateWrongQuestion(i);
            newQuestion['correctWrongNum'] = correctWrongNum
            newQuestion['totalWrongNum'] = wrongArray.length
            newQuestion['caculateWrongNum'] = caculateWrongNum
        }
        if(i>=wrongArray.length){
            newQuestion = {"question":"已完成！",'correctNum':gradeCorrectNum,'totalNum':gradeTotalNum,'correctWrongNum': correctWrongNum,'caculateWrongNum':caculateWrongNum,'totalWrongNum':wrongArray.length}
        }
        finish = false
        console.log(caculateWrongNum,i)
        i += 1
    }
}
let normalGet = ()=>{
    if(finish){
        newQuestion = generateQuestion();
        // console.log(newQuestion)
        finish = false
    }
}
// 处理用户提交答案的路由
let objTotal = []
app.post('/submit', (req, res) => {
    if(finish){
        res.redirect('/');
        return 0
    }
    const userAnswer = req.body.answer;
    const userAnswer2 = req.body.yu;
    // console.log(req.body,userAnswer,userAnswer2)
    let resultTotal = newQuestion
    resultTotal['result1'] = userAnswer
    resultTotal['result2'] = userAnswer2
    resultTotal['correct'] = check(resultTotal['one'],resultTotal['two'],resultTotal['type'],userAnswer,userAnswer2)
    if(resultTotal.correct==true){
        gradeCorrectNum += 1
        correctWrongNum += 1
    }
    caculateWrongNum += 1
    gradeTotalNum += 1
    resultTotal.correctNum = gradeCorrectNum
    resultTotal.totalNum = gradeTotalNum
    //写入json文件
    try {
        // pretty-print JSON object to string
        objTotal.push(resultTotal)
        fs.writeFileSync(path, JSON.stringify(objTotal))
    } catch (err) {
        console.error(err)
    }
    console.log(`${newQuestion.question}${userAnswer}余${userAnswer2},${resultTotal['correct']?'对':'错'},第${gradeTotalNum}道`)
    finish = true
    res.redirect('/');
});

// 轮询获取新题目的路由,前端不作配置，只识别flag判断模式
app.get('/getQuestion', (req, res) => {
    //第一次生成后，除非完成题目，否则题目不刷新。但是多次访问可以有反馈
    if(flag=='normal'){
        normalGet()
    }else if(flag=='wrong'){
        wrongGet()
    }
    res.json(newQuestion);
});

//chatBox
app.get('/chatBox',(req,res)=>{
    // console.log('getChatBox...');
    checkDir = fs.existsSync("chatBox.txt");
    if(checkDir){
        fs.readFile("chatBox.txt","utf-8",function(error,data){   
            if(error){
                throw error
            }else{
                res.json({'chatBox':data.toString()})
                // console.log(data.toString());
            }
            // console.log(data.toString());
        });
    }
})
app.listen(3000, () => {
  console.log('Server is running on port 3000\n http://127.0.0.1:3000');
});