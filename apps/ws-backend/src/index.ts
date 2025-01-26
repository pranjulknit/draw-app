import { JWT_SECRET } from '@repo/backend-common/config';
import { WebSocketServer,WebSocket } from 'ws';
import jwt, { JwtPayload } from "jsonwebtoken";
import { prismaClient } from '@repo/db/client';
import { parse } from 'path';


const wss = new WebSocketServer({port:8080});

interface User{
    ws:WebSocket,
    rooms:string[],
    userId:string
}

const users:User[] = [];




function checkUser(token:string):string | null{


    try{
        const decoded = jwt.verify(token,JWT_SECRET);
        console.log("decoded ws backend",decoded)

        if(!decoded || !(decoded as JwtPayload).userId){
          
            return null;
        }
    
        return (decoded as JwtPayload).userId;
    }catch(e){
        console.log("jwt verfiy error in websocekt",e);
        return null;
    }

    return null;

 

}

wss.on('connection', function connection(ws,request){
    ws.on('error',console.error);
    const url = request.url;

    if(!url){
        return;
    }

    const queryParams = new URLSearchParams(url.split('?')[1]);
    
    const token = queryParams.get('token') || "";
    const userAuthenticated = checkUser(token);

    if(!userAuthenticated){
        ws.close();
        return null;
    }

    users.push({
        userId:userAuthenticated,
        rooms:[],
        ws
    })

    ws.on('message',async function message(data:string){
             
        const parsedData =  JSON.parse(data);
        console.log("parsed data ",parsedData);
        if(parsedData.type === "join_room"){
            const user = users.find(x=>x.ws === ws);
            user?.rooms.push(parsedData.roomId);
        }

        if(parsedData.type === "leave_room"){
            const user = users.find(x=>x.ws === ws);
            if(!user){
                return;
            }
            user.rooms = user?.rooms.filter(x=>x === parsedData.room);
        }

        if(parsedData.type === "chat"){
            const roomId = parsedData.roomId;
            const message = parsedData.message;

            await prismaClient.chat.create({
                data:{
                        roomId,message,userId:userAuthenticated
                }
            })
            users.forEach(user=>{
                if(user.rooms.includes(roomId)){
                    user.ws.send(JSON.stringify({
                        type:"chat",
                        message:message,
                        roomId
                    }))
                }
            })
        }
    })

    ws.send('send something');
})