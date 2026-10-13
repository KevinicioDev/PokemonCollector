import PortfolioDashboard from "@/src/components/PortfolioDashboard";
import CardSearch from "@/src/components/CardSearch";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-8 text-center text-yellow-400">
        Pokémon Portfolio
      </h1>

      <PortfolioDashboard />

      <div className="mt-12 w-full flex flex-col items-center">
        <CardSearch />
      </div>
    </main>
  );
}
