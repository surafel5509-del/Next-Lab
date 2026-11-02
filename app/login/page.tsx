"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
        if (authError) throw authError;
        if (!data.session) setMessage("Account created. Check your email to confirm your address, then sign in.");
        else router.push("/workspace");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        router.push("/workspace"); router.refresh();
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Authentication failed."); }
    finally { setBusy(false); }
  }

  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"radial-gradient(ellipse at 50% 0%,#242044 0%,#090b10 55%)"}}>
    <section style={{width:"100%",maxWidth:430,border:"1px solid #292e3d",background:"#10131b",borderRadius:18,padding:30,boxShadow:"0 24px 90px #0008"}}>
      <Link href="/" style={{fontFamily:"Space Grotesk",fontWeight:700,fontSize:20,letterSpacing:-.5}}>NEXT<span style={{color:"#a99cff"}}>LAB</span></Link>
      <p style={{color:"#9ba3b3",fontSize:12,marginTop:24}}>YOUR AI DEVELOPMENT WORKSPACE</p>
      <h1 style={{fontFamily:"Space Grotesk",fontSize:27,margin:"8px 0"}}>{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
      <p style={{color:"#8992a3",fontSize:13,marginBottom:22}}>Sign in to manage models, datasets, and training runs.</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",padding:4,background:"#090c12",borderRadius:10,marginBottom:20}}>
        <button onClick={()=>{setMode("signin");setMessage("");setError("");}} style={{padding:10,border:0,borderRadius:8,background:mode==="signin"?"#292542":"transparent",color:"#f3f5fa"}}>Sign in</button>
        <button onClick={()=>{setMode("signup");setMessage("");setError("");}} style={{padding:10,border:0,borderRadius:8,background:mode==="signup"?"#292542":"transparent",color:"#f3f5fa"}}>Create account</button>
      </div>
      <form onSubmit={submit} style={{display:"grid",gap:13}}>
        {mode==="signup" && <label style={{display:"grid",gap:7,color:"#b9c0ce",fontSize:12}}>Name<input required value={name} onChange={e=>setName(e.target.value)} autoComplete="name" style={field}/></label>}
        <label style={{display:"grid",gap:7,color:"#b9c0ce",fontSize:12}}>Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" style={field}/></label>
        <label style={{display:"grid",gap:7,color:"#b9c0ce",fontSize:12}}>Password<input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==="signin"?"current-password":"new-password"} style={field}/></label>
        {error && <p role="alert" style={{color:"#ff9292",fontSize:12,margin:0}}>{error}</p>}
        {message && <p role="status" style={{color:"#74dfb9",fontSize:12,margin:0}}>{message}</p>}
        <button disabled={busy} type="submit" style={{marginTop:5,padding:13,border:0,borderRadius:9,background:"#8978f5",color:"white",fontWeight:700,opacity:busy?.65:1}}>{busy?"Please wait…":mode==="signin"?"Sign in to Next Lab":"Create account"}</button>
      </form>
      <p style={{fontSize:11,color:"#697386",lineHeight:1.6,marginTop:20}}>By continuing, you agree to use Next Lab responsibly. Your workspace data is isolated by database row-level security.</p>
    </section>
  </main>;
}

const field = {width:"100%",padding:"12px 13px",border:"1px solid #303748",borderRadius:9,background:"#0b0e15",color:"#f3f5fa",outline:"none",fontSize:13};
