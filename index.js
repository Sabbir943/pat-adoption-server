const express=require('express');
const cors=require('cors');
const dotenv=require('dotenv');
const app=express();

const PORT=8000;
app.use(express.json());
app.use(cors());

app.get('/',async(req,res)=>{
    res.send('server is ready!!!!!');
})
app.get('/user',async(req,res)=>{
    res.send('user is running');
})

app.listen(PORT,()=>{
    console.log(`server is running is port ${PORT}`);
})