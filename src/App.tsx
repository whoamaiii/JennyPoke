import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Suspense, lazy, useEffect, useState } from "react";
import { toast } from "sonner";

// Lazy load components
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

// Card Preloader component - handles initializing session cards
const CardPreloader = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Initialize session cards when app loads
    const initializeCards = async () => {
      setIsLoading(true);
      try {
        // Dynamic import to avoid issues with server-side rendering
        const { initializeSessionCards, getSessionStats } = await import('@/services/sessionCardManager');
        
        // Check if we have cards in session already
        const stats = getSessionStats();
        if (stats.totalCards === 0) {
          toast.info('Downloading cards for offline play...');
          await initializeSessionCards();
        } else {
          console.log(`Using ${stats.availableCards} available cards from session`);
        }
      } catch (error) {
        console.error('Failed to initialize session cards:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeCards();
  }, []);
  
  return null; // This component doesn't render anything visible
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {/* Card preloader runs as soon as the app mounts */}
          <CardPreloader />
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
