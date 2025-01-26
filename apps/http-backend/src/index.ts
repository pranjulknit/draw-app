import { prismaClient } from "@repo/db/client";
import express from "express";
import jwt from "jsonwebtoken";
import middileware from "./middileware";
import {CreateRoomSchema, createSchema, SigninSchema} from "@repo/common/types";
import { JWT_SECRET } from "@repo/backend-common/config";


const app = express();


app.use(express.json());


app.post('/signup',async (req,res)=>{

    const parsedData = createSchema.safeParse(req.body);
    //console.log("parseddata ",parsedData)
    console.log(parsedData.error);

    if(!parsedData.success){
       res.json({
            message:"Incorrect inputs"
        });
        return;
    }

    // db call


    try{
       const user = await prismaClient.user.create({
          data: {
            
            email: parsedData?.data.username,

            // hashing the password
            password: parsedData?.data.password,
            name: parsedData?.data.name,
            photo:"defaulturl"// Add a default photo URL or handle it accordingly
          }
            
        })

        res.json({
            userId:(user?.id || 123)
        })
        
    }catch(e){
        res.status(411).json({
            message:"User already exists with username"
        })
    }

    

    const {name,email,password} = req.body;


})
app.post('/signin',async (req,res)=>{

    const parsedData = SigninSchema.safeParse(req.body);

    if(!parsedData.success){
       res.json({
            message:"Incorrect inputs"
        });
        return;
    }

    //comparing the hashed password

    const user = await prismaClient.user.findFirst({
        where:{
            email:parsedData.data.username,
            password:parsedData.data.password
        }
    })

    if(!user){
        res.status(403).json({
            message:"Not Authorized"
        })
        return;
    }
     
    const token = jwt.sign({
        userId:user?.id
    },JWT_SECRET);

    res.json({
        token
    })
})
app.post('/room',middileware,async(req,res)=>{

    const parsedData = CreateRoomSchema.safeParse(req.body);

    if(!parsedData.success){
       res.json({
            message:"Incorrect inputs"
        });
        return;
    }
    //@ts-ignore
    const userId = req.userId;

    // db call


    try{
        const room = await prismaClient.room.create({
            data:{
                slug:parsedData.data.name,
                adminId:userId
    
            }
        })
    
        res.json({
            roomId:room.id
        })
    }
    catch(e){
        res.status(411).json({
            message:"room already exists"
        })
    }

  

    
});

app.get("/room/:slug",async (req,res)=>{
    const slug = req.params.slug;
     try{
        const room =await prismaClient.room.findFirst({
           where:{
                slug
           }
        })
        res.json({
            room
        })
     }catch(e){
        console.log("getting errro in fetching messages from room",e);
     }
    
})

app.get("/chats/:roomId",async (req,res)=>{
    try {
        const roomId =Number(req.params.roomId);
        const messages = await prismaClient.chat.findMany({
            where:{
                roomId:roomId
            },orderBy:{
                id:"desc"
            },
            take:50
        })

        res.json({
            messages
        })
    } catch (error) {
        console.log("errror at chat endpoint",error);

        res.json({
            messages:[]
        })
    }
    
})

app.listen(3010);