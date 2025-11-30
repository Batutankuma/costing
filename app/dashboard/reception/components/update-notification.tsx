"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, RefreshCw, AlertTriangle } from "lucide-react";

interface UpdateNotificationProps {
  lastUpdate: Date;
  isRefreshing?: boolean;
  hasUpdates?: boolean;
}

export default function UpdateNotification({ 
  lastUpdate, 
  isRefreshing = false,
  hasUpdates = false 
}: UpdateNotificationProps) {
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>("");

  useEffect(() => {
    const updateTimeSince = () => {
      const now = new Date();
      const diff = now.getTime() - lastUpdate.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);

      if (seconds < 60) {
        setTimeSinceUpdate(`${seconds} seconde${seconds > 1 ? 's' : ''}`);
      } else if (minutes < 60) {
        setTimeSinceUpdate(`${minutes} minute${minutes > 1 ? 's' : ''}`);
      } else {
        const hours = Math.floor(minutes / 60);
        setTimeSinceUpdate(`${hours} heure${hours > 1 ? 's' : ''}`);
      }
    };

    updateTimeSince();
    const interval = setInterval(updateTimeSince, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  if (isRefreshing) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
        <AlertDescription className="text-blue-800">
          Mise à jour en cours... Veuillez patienter.
        </AlertDescription>
      </Alert>
    );
  }

  if (hasUpdates) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Données mises à jour ! Dernière mise à jour : il y a {timeSinceUpdate}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-gray-200 bg-gray-50">
      <AlertTriangle className="h-4 w-4 text-gray-600" />
      <AlertDescription className="text-gray-700">
        Dernière mise à jour : il y a {timeSinceUpdate}
      </AlertDescription>
    </Alert>
  );
}
