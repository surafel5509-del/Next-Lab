import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  if (error || !claimsData?.claims) redirect("/login");
  const userId = String(claimsData.claims.sub);
  const [{ data: profile }, { data: workspaces }, models, datasets, jobs] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
    supabase.from("workspaces").select("id,name,slug,created_at").order("created_at", { ascending: true }),
    supabase.from("models").select("id", { count: "exact", head: true }),
    supabase.from("datasets").select("id", { count: "exact", head: true }),
    supabase.from("training_jobs").select("id", { count: "exact", head: true }).in("status", ["queued", "running"]),
  ]);
  const name = profile?.display_name || "Builder";
  return <main style={{minHeight:"100vh",padding:32,background:"#090b10",color:"#f3f5fa",fontFamily:"DM Sans, sans-serif"}}>
    <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,borderBottom:"1px solid #242a37",paddingBottom:20}}>
      <Link href="/" style={{fontFamily:"Space Grotesk",fontWeight:700,fontSize:20}}>NEXT<span style={{color:"#a99cff"}}>LAB</span></Link>
      <form action="/auth/signout" method="post"><button style={{background:"#171b26",border:"1px solid #303748",borderRadius:8,color:"#cbd1dd",padding:"9px 13px"}}>Sign out</button></form>
    </header>
    <section style={{maxWidth:1100,margin:"44px auto"}}>
      <p style={{fontSize:11,letterSpacing:2,color:"#a99cff"}}>PERSONAL WORKSPACE</p>
      <h1 style={{fontFamily:"Space Grotesk",fontSize:32,margin:"8px 0"}}>Welcome, {name}</h1>
      <p style={{color:"#929bad",fontSize:14}}>Your account is connected to the Next Lab platform database.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:13,marginTop:28}}>
        {[[ "Models", models.count ?? 0 ],["Datasets",datasets.count ?? 0],["Active jobs",jobs.count ?? 0],["Workspaces",workspaces?.length ?? 0]].map(([label,value])=><div key={String(label)} style={{background:"#121722",border:"1px solid #293040",borderRadius:12,padding:18}}><div style={{fontSize:12,color:"#929bad"}}>{label}</div><div style={{fontSize:29,fontFamily:"Space Grotesk",marginTop:8}}>{value}</div></div>)}
      </div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:26}}><Link href="/datasets" style={{background:"#8978f5",borderRadius:9,padding:"10px 15px",fontSize:12,fontWeight:700}}>Manage datasets →</Link></div>\n      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:10}}><Link href="/models" style={{background:"#171b26",border:"1px solid #303748",borderRadius:9,padding:"10px 15px",fontSize:12}}>Model registry →</Link></div>
      <h2 style={{fontSize:16,marginTop:34}}>Your workspaces</h2>
      <div style={{display:"grid",gap:10,marginTop:12}}>{(workspaces ?? []).map(w=><div key={w.id} style={{background:"#121722",border:"1px solid #293040",borderRadius:11,padding:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><strong>{w.name}</strong><div style={{fontSize:11,color:"#828b9c",marginTop:5}}>{w.slug}</div></div><span style={{fontSize:11,color:"#67dcb7"}}>Connected</span></div>)}{!workspaces?.length&&<p style={{color:"#929bad",fontSize:13}}>No workspace found yet. Your first workspace is created automatically after account confirmation.</p>}</div>
      <p style={{marginTop:28,fontSize:12,color:"#737e91",lineHeight:1.7}}>Dataset uploads are stored privately and scoped to your workspace. Model projects and dataset management are connected. GPU training workers, inference, evaluation execution, and deployment controls remain future milestones.</p>
    </section>
  </main>;
}
