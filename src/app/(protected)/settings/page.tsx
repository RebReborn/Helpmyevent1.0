'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ModeToggle } from '@/components/mode-toggle';
import { 
  Paintbrush, 
  Bell, 
  Shield, 
  User, 
  Palette,
  Moon,
  Sun,
  Laptop,
  Check,
  Settings2,
  Eye
} from 'lucide-react';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    offers: true,
    messages: false,
  });

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showOnlineStatus: true,
    allowMessages: true,
  });

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrivacyChange = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun, description: 'Clean and bright' },
    { value: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes' },
    { value: 'system', label: 'System', icon: Laptop, description: 'Follows your device' },
  ];

  return (
    <div className="container mx-auto max-w-4xl py-6 px-4 sm:px-6">
      {/* Header Section */}
      <div className="space-y-2 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-lg text-muted-foreground mt-1">
              Manage your account preferences and application settings
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardContent className="p-4">
              <nav className="space-y-2">
                {[
                  { id: 'appearance', label: 'Appearance', icon: Palette, active: true },
                  { id: 'notifications', label: 'Notifications', icon: Bell },
                  { id: 'privacy', label: 'Privacy & Security', icon: Shield },
                  { id: 'account', label: 'Account', icon: User },
                ].map((item) => (
                  <Button
                    key={item.id}
                    variant={item.active ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    {item.active && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Active
                      </Badge>
                    )}
                  </Button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appearance Settings */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-headline text-2xl">Appearance</CardTitle>
                  <CardDescription>
                    Customize how HelpMyEvent looks and feels
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Color Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred interface theme
                    </p>
                  </div>
                  <ModeToggle />
                </div>

                {/* Theme Preview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  {themeOptions.map((theme) => (
                    <div
                      key={theme.value}
                      className="relative cursor-pointer group"
                      onClick={() => {/* Add theme change handler */}}
                    >
                      <div className={`
                        border-2 rounded-lg p-4 transition-all duration-200
                        ${theme.value === 'light' 
                          ? 'bg-white border-gray-300' 
                          : theme.value === 'dark'
                          ? 'bg-gray-900 border-gray-700'
                          : 'bg-background border-border'
                        }
                        group-hover:border-primary group-hover:shadow-md
                      `}>
                        <div className="flex items-center gap-3 mb-3">
                          <theme.icon className={`
                            h-4 w-4
                            ${theme.value === 'dark' ? 'text-white' : 'text-gray-600'}
                          `} />
                          <span className={`
                            font-medium text-sm
                            ${theme.value === 'dark' ? 'text-white' : 'text-gray-900'}
                          `}>
                            {theme.label}
                          </span>
                        </div>
                        <p className={`
                          text-xs
                          ${theme.value === 'dark' ? 'text-gray-400' : 'text-gray-600'}
                        `}>
                          {theme.description}
                        </p>
                        
                        {/* Active indicator */}
                        {theme.value === 'light' && (
                          <div className="absolute top-3 right-3">
                            <div className="bg-primary text-primary-foreground rounded-full p-1">
                              <Check className="h-3 w-3" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Additional Appearance Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label className="font-semibold">High Contrast Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Increase contrast for better visibility
                      </p>
                    </div>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Paintbrush className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label className="font-semibold">Reduced Animations</Label>
                      <p className="text-sm text-muted-foreground">
                        Minimize motion and transitions
                      </p>
                    </div>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Bell className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="font-headline text-2xl">Notifications</CardTitle>
                  <CardDescription>
                    Manage how you receive updates and alerts
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-3">
                  <div>
                    <Label className="font-semibold capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {key === 'email' && 'Receive notifications via email'}
                      {key === 'push' && 'Get push notifications in your browser'}
                      {key === 'offers' && 'Alert when you receive new offers'}
                      {key === 'messages' && 'Notify about new messages'}
                    </p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={() => handleNotificationChange(key as keyof typeof notifications)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Shield className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="font-headline text-2xl">Privacy & Security</CardTitle>
                  <CardDescription>
                    Control your visibility and data preferences
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(privacy).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-3">
                  <div>
                    <Label className="font-semibold capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {key === 'profileVisible' && 'Make your profile discoverable to other users'}
                      {key === 'showOnlineStatus' && 'Display when you are active on the platform'}
                      {key === 'allowMessages' && 'Allow other users to message you directly'}
                    </p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={() => handlePrivacyChange(key as keyof typeof privacy)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" className="min-w-24">
              Cancel
            </Button>
            <Button className="min-w-24 bg-primary hover:bg-primary/90">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
