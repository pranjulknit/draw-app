"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function  Home(){
  const[roomId, setroomId] = useState("");
  const router = useRouter();

  return(
    <div style={
      {
        display:"flex",
        
        alignItems:"center",
        justifyContent:"center",
        height:"100vh",
        width:"100vw"
      }
    }>
      <input style={{padding:10}} value={roomId} type="text" onChange={(e)=>{
        setroomId(e.target.value);
      }} placeholder="Room id" />

      <button  style={{padding:10}} onClick={()=>{
        router.push(`/room/${roomId}`)
      }}>Join Room</button>

    </div>
  )
}