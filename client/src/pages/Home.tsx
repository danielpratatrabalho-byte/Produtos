import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-primary">Lista de Produtos</h1>
        <p className="text-lg text-muted-foreground">
          Gerencie seus produtos e colabore com amigos em tempo real
        </p>
        
        <div className="space-y-3 pt-8">
          <Link href="/messages">
            <Button size="lg" className="w-48">
              Ir para Colaboração
            </Button>
          </Link>
          
          <p className="text-sm text-muted-foreground pt-4">
            Bem-vindo ao seu hub de colaboração!
          </p>
        </div>
      </div>
    </div>
  );
}
