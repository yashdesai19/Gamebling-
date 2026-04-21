import Navbar from "@/components/Navbar";

export default function MyPredictionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <div className="max-w-2xl">
          <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-wide">My Bets</h1>
          <p className="text-muted-foreground mt-2">This page is protected. Next we can show your bet history here.</p>
        </div>
      </div>
    </div>
  );
}

