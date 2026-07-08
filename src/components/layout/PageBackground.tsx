import { NeuralField } from "@/components/NeuralField";

export function PageBackground({ density = 140 }: { density?: number }) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <NeuralField density={density} fixed />
      <div className="absolute inset-0 noise opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/45 to-background/90" />
    </div>
  );
}
