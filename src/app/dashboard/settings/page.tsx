'use client';

import { useState, useEffect } from 'react';
import {
  Card, CardHeader, CardTitle,
  CardDescription, CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check, Mail, Phone, CreditCard, Bot } from 'lucide-react';

export default function SettingsPage() {
  const [copied, setCopied] = useState(false);
  const [agentId, setAgentId] = useState<string>('');
  const [agentName, setAgentName] = useState<string>('Alex');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/agent/default')
      .then((r) => r.json())
      .then((data) => {
        if (data.agentId) setAgentId(data.agentId);
        if (data.agentName) setAgentName(data.agentName);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const embedCode = agentId
    ? `<script>\n(function(){\n  var s = document.createElement('script');\n  s.src = '${appUrl}/widget.js';\n  s.async = true;\n  s.onload = function(){ window.U8U.init({ agentId: '${agentId}' }); };\n  document.body.appendChild(s);\n})();\n</script>`
    : 'Loading agent ID...';

  const copyCode = () => {
    if (!agentId) return;
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const integrations = [
    { name: 'SendGrid', icon: Mail, color: 'text-green-600' },
    { name: 'Twilio', icon: Phone, color: 'text-red-600' },
    { name: 'Stripe', icon: CreditCard, color: 'text-purple-600' },
    { name: 'OpenAI', icon: Bot, color: 'text-blue-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* Chat Widget */}
      <Card>
        <CardHeader>
          <CardTitle>Chat Widget</CardTitle>
          <CardDescription>
            Embed this on your website to activate the AI chat agent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Agent:</span>
            <span className="font-medium">{agentName}</span>
            <Badge variant="success">Active</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Agent ID:</span>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
              {loading ? 'Loading...' : (agentId || 'Not found')}
            </code>
          </div>
          <div className="relative">
            <div className="bg-gray-900 rounded-lg p-4 pr-16 min-h-[80px]">
              <pre className="text-green-400 text-xs whitespace-pre-wrap break-all">
                {embedCode}
              </pre>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-2 right-2"
              onClick={copyCode}
              disabled={!agentId}
            >
              {copied
                ? <Check className="w-4 h-4 text-green-600" />
                : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste before the closing &lt;/body&gt; tag on your website.
          </p>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Connected services and APIs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {integrations.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <item.icon className={`h-5 w-5 ${item.color}`} />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              <Badge variant="success">Connected</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}