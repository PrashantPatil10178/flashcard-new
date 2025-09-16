import { useState, useEffect } from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import FlashcardSetList from "./pages/FlashcardSet";
import Standard from "./pages/Standard";
import { trackPageView } from "./lib/analytics";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function App() {
  const [selectedStandard, setSelectedStandard] = useState<string | null>(null);

  useEffect(() => {
    if (selectedStandard) {
      trackPageView(`/standard/${selectedStandard}`);
    } else {
      trackPageView("/");
    }
  }, [selectedStandard]);

  const handleSelectStandard = (standard: string) => {
    setSelectedStandard(standard);
  };

  const handleBackToStandards = () => {
    setSelectedStandard(null);
  };

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {selectedStandard ? (
          <FlashcardSetList
            standard={selectedStandard}
            onBack={handleBackToStandards}
          />
        ) : (
          <Standard onSelectStandard={handleSelectStandard} />
        )}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
