'use client';

import Link from 'next/link';
import { Bot, Mail, Phone, BarChart3, Calendar, Shield, ArrowRight, MessageCirclePlus, SquareKanbanIcon, Workflow } from 'lucide-react';

export default function HomePage() {
  const features = [
    { icon: MessageCirclePlus, title: '24/7 AI Chat', description: 'Engage visitors instantly with intelligent conversations' },
    { icon: Mail, title: 'Email Automation', description: 'Automated personalized outreach that converts' },
    { icon: Phone, title: 'Voice AI Calls', description: 'Natural phone conversations powered by AI' },
    { icon: BarChart3, title: 'BANT Scoring', description: 'Automatic lead qualification with AI' },
    { icon: Calendar, title: 'Meeting Booking', description: 'Seamless calendar integration' },
    // { icon: Shield,            title: 'Enterprise Ready',  description: 'Secure, scalable, reliable' },
    { icon: Bot, title: 'Custom AI Agents', description: 'Tailor agents to your unique sales process' },
    { icon: SquareKanbanIcon, title: 'CRM Integration', description: 'Sync data with your CRM in real-time' },
    { icon: Workflow, title: 'Full Automation', description: 'Engage leads on their preferred channels' },
  ];

  const comparisonRows = [
    ['Understands customer intent', '✕', '⚠', '✓ Intelligent AI'],
    ['Real-time decision making', 'Rule-based', 'Basic', '✓ Dynamic AI'],
    ['Handles objections', '✕', 'Weak', '✓ Human-like'],
    ['Guides buying decision', '✕', 'Partial', '✓ Smart guidance'],
    ['Closes deals', '✕', '✕', '✓ Revenue-focused'],
    ['Multi-channel support', '✕', 'Partial', '✓ Full coverage'],
    ['Complete system', '✕', '✕', '✓ End-to-End'],
    ['Lead auto-qualification', 'Partial', 'Weak', '✓ BANT scoring'],
    ['Voice AI calling', '✕', '✕', '✓ Native support'],
    ['Works 24/7 autonomously', '✕', 'Partial', '✓ Always on'],
  ];

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Ambient background orbs */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '-5%',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', top: '30%', right: '-10%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', left: '20%',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)',
        }} />
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        background: 'rgba(10,10,15,0.75)',
      }}>
        <nav className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" style={{
            fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em',
            color: '#fff',
          }}>
            u8u<span style={{ color: '#818cf8' }}>.ai</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/sign-up">
              <button style={{
                padding: '8px 20px', borderRadius: '10px', fontSize: '14px',
                fontWeight: 500, color: '#fff', cursor: 'pointer',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none', boxShadow: '0 0 24px rgba(99,102,241,0.35)',
                transition: 'all 0.2s',
              }}>Sign Up</button>
            </Link>
            <Link href="/sign-in">
              <button style={{
                padding: '8px 20px', borderRadius: '10px', fontSize: '14px',
                fontWeight: 500, color: '#fff', cursor: 'pointer',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none', boxShadow: '0 0 24px rgba(99,102,241,0.35)',
                transition: 'all 0.2s',
              }}
                // onMouseOver={(e) => { (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.3)'; (e.target as HTMLElement).style.color = '#fff'; }}
                // onMouseOut={(e) => { (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.3)'; (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
              >Log In</button>
            </Link>
          </div>
        </nav>
      </header>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section style={{ padding: '100px 0 80px', textAlign: 'center' }}>
          <div className="container mx-auto px-6">

            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 16px', borderRadius: '100px', marginBottom: '32px',
              border: '1px solid rgba(99,102,241,0.35)',
              background: 'rgba(99,102,241,0.08)',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8', display: 'inline-block' }} />
              <span style={{ fontSize: '13px', color: '#a5b4fc', fontWeight: 500, letterSpacing: '0.02em' }}>
                AI Sales Automation for Indian Startups
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1,
              color: '#fff', marginBottom: '24px',
            }}>
              AI Sales Agents That<br />
              <span style={{
                background: 'linear-gradient(135deg, #818cf8, #c4b5fd)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Never Sleep</span>
            </h1>

            <p style={{
              fontSize: '1.15rem', color: 'rgba(255,255,255,0.5)',
              maxWidth: '560px', margin: '0 auto 40px', lineHeight: 1.7,
            }}>
              Automate lead qualification, engagement, and meeting booking
              with AI agents that work 24/7 across chat, email, voice, and WhatsApp.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/sign-up">
                <button style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '14px 28px', borderRadius: '12px', fontSize: '15px',
                  fontWeight: 600, color: '#fff', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none', boxShadow: '0 0 40px rgba(99,102,241,0.4)',
                }}>
                  Start Free
                  <ArrowRight size={16} />
                </button>
              </Link>
              {/* <Link href="/sign-in">
                <button style={{
                  padding: '14px 28px', borderRadius: '12px', fontSize: '15px',
                  fontWeight: 500, color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  Log In
                </button>
              </Link> */}
            </div>

            {/* Stats row */}
            <div style={{
              display: 'flex', gap: '32px', justifyContent: 'center',
              marginTop: '64px', flexWrap: 'wrap',
            }}>
              {[
                { val: '10x', label: 'More leads contacted' },
                { val: '24/7', label: 'Always working' },
                { val: '10', label: 'Indian languages' },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>{s.val}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────────── */}
        <section style={{ padding: '80px 0' }}>
          <div className="container mx-auto px-6">
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', marginBottom: '12px' }}>
                Everything You Need
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px' }}>One platform. All channels. Zero manual effort.</p>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}>
              {features.map((feature, i) => (
                <div key={feature.title} style={{
                  padding: '28px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.03)',
                  backdropFilter: 'blur(12px)',
                  transition: 'border-color 0.2s, background 0.2s',
                  animationDelay: `${i * 0.05}s`,
                }}
                  onMouseOver={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'rgba(99,102,241,0.3)';
                    el.style.background = 'rgba(99,102,241,0.06)';
                  }}
                  onMouseOut={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'rgba(255,255,255,0.07)';
                    el.style.background = 'rgba(255,255,255,0.03)';
                  }}
                >
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: 'rgba(99,102,241,0.15)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', marginBottom: '18px',
                  }}>
                    <feature.icon size={20} style={{ color: '#818cf8' }} />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
                    {feature.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Comparison Table ──────────────────────────────────────── */}
        <section style={{ padding: '80px 0' }}>
          <div className="container mx-auto px-6">
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#fff', marginBottom: '12px' }}>
                Why Teams Choose <span style={{ color: '#818cf8' }}>u8u.ai</span>
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px' }}>A new standard for intelligent sales systems.</p>
            </div>

            <div style={{
              borderRadius: '20px', overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {['Capability', 'Automation', 'AI Tools', 'u8u.ai'].map((h, i) => (
                        <th key={h} style={{
                          padding: '16px 24px',
                          textAlign: 'center',
                          fontWeight: 500, fontSize: '13px',
                          color: i === 3 ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
                          background: i === 3 ? 'rgba(99,102,241,0.08)' : 'transparent',
                          letterSpacing: '0.02em',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map(([capability, auto, aiTools, u8u], i) => (
                      <tr key={i} style={{
                        borderBottom: i < comparisonRows.length - 1
                          ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        transition: 'background 0.15s',
                      }}
                        onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                        onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '14px 24px', color: 'rgba(255,255,255,0.7)', fontSize: '14px', textAlign: 'center' }}>
                          {capability}
                        </td>
                        <td style={{ padding: '14px 24px', textAlign: 'center' }}>
                          <span style={{
                            color: auto === '✕' ? 'rgba(255,255,255,0.25)'
                              : auto === '⚠' ? 'rgba(255,255,255,0.45)'
                                : 'rgba(255,255,255,0.45)',
                            fontSize: '13px',
                          }}>{auto}</span>
                        </td>
                        <td style={{ padding: '14px 24px', textAlign: 'center' }}>
                          <span style={{
                            color: aiTools === '✕' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.45)',
                            fontSize: '13px',
                          }}>{aiTools}</span>
                        </td>
                        <td style={{
                          padding: '14px 24px', textAlign: 'center',
                          background: 'rgba(99,102,241,0.05)',
                        }}>
                          <span style={{ color: '#a5b4fc', fontSize: '13px', fontWeight: 500 }}>{u8u}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────── */}
        <section style={{ padding: '80px 0 100px' }}>
          <div className="container mx-auto px-6">
            <div style={{
              borderRadius: '24px', padding: '64px 40px', textAlign: 'center',
              border: '1px solid rgba(99,102,241,0.25)',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 100%)',
              backdropFilter: 'blur(20px)',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* subtle grid overlay */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: 'linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{
                  fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.03em',
                  color: '#fff', marginBottom: '16px',
                }}>
                  Ready to close more deals?
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px', marginBottom: '36px' }}>
                  Start free. No credit card required.
                </p>
                <Link href="/sign-up">
                  <button style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '14px 32px', borderRadius: '12px', fontSize: '15px',
                    fontWeight: 600, color: '#fff', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none', boxShadow: '0 0 40px rgba(99,102,241,0.5)',
                  }}>
                    Get Started Free
                    <ArrowRight size={16} />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <footer style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '28px 0', textAlign: 'center',
          color: 'rgba(255,255,255,0.25)', fontSize: '13px',
        }}>
          © {new Date().getFullYear()} Fuelo Technologies (OPC) Private Limited. Built for Startups.
        </footer>

      </div>
    </div>
  );
}


// import Link from 'next/link';
// import { Button } from '@/components/ui/button';
// import { Bot, Mail, Phone, BarChart3, Calendar, Shield, ArrowRight, CheckCircle, MessageCircle, MessageCirclePlus, SquareKanbanIcon, Workflow } from 'lucide-react';
// import { Agent } from 'http';
// // import { LandingChat } from '@/components/chat/LandingChat';

// export default function HomePage() {
//   const features = [
//     { icon: MessageCirclePlus, title: '24/7 AI Chat', description: 'Engage visitors instantly with intelligent conversations' },
//     { icon: Mail, title: 'Email Automation', description: 'Automated personalized outreach that converts' },
//     { icon: Phone, title: 'Voice AI Calls', description: 'Natural phone conversations powered by AI' },
//     { icon: BarChart3, title: 'BANT Scoring', description: 'Automatic lead qualification with AI' },
//     { icon: Calendar, title: 'Meeting Booking', description: 'Seamless calendar integration' },
//     { icon: Shield, title: 'Enterprise Ready', description: 'Secure, scalable, reliable' },
//     { icon: Bot, title: 'Custom AI Agents', description: 'Tailor agents to your unique sales process' },
//     { icon: SquareKanbanIcon, title: 'CRM Integration', description: 'Sync data with your CRM in real-time' },
//     { icon: Workflow, title: 'Full Automation', description: 'Engage leads on their preferred channels' },
//   ];

//   const plans = [
//     { name: 'Free', price: '₹0', conversations: '50', features: ['Chat only', '1 Agent', 'Basic analytics'] },
//     { name: 'Starter', price: '₹1,999', conversations: '200', features: ['Chat + Email', '2 Agents', 'BANT scoring', 'Email sequences'] },
//     { name: 'Growth', price: '₹4,999', conversations: '500', features: ['All channels', '5 Agents', 'CRM sync', 'Priority support'], popular: true },
//     { name: 'Pro', price: '₹9,999', conversations: '2000', features: ['Everything', 'Unlimited agents', 'Voice calls', 'API access', 'Custom training'] },
//   ];

//   return (
//     <div className="min-h-screen bg-white">
//       <header className="border-b">
//         <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
//           <Link href="/" className="text-2xl font-bold">u8u<span className="text-primary">.ai</span></Link>
//           <div className="flex items-center gap-4">
//             <Link href="/sign-up"><Button>Sign Up</Button></Link>
//             <Link href="/sign-in"><Button variant="ghost">Sign In</Button></Link>
//           </div>
//         </nav>
//       </header>

//       <section className="py-20 text-center">
//         <div className="container mx-auto px-4">
//           <h1 className="text-5xl font-bold mb-6">AI Sales Agents That<br /><span className="text-primary">Never Sleep</span></h1>
//           <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">Automate lead qualification, engagement, and meeting booking with AI agents that work 24/7.</p>
//           <div className="flex gap-4 justify-center">
//             <Link href="/sign-up"><Button size="lg" className='border-2'>Start Free <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
//             {/* <Link href="#pricing"><Button variant="outline" size="lg">View Pricing</Button></Link> */}
//           </div>
//         </div>
//       </section>

//       <section className="py-20 bg-gray-50">
//         <div className="container mx-auto px-4">
//           <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
//           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
//             {features.map((feature) => (
//               <div key={feature.title} className="bg-white p-6 rounded-xl border">
//                 <feature.icon className="h-10 w-10 text-primary mb-4" />
//                 <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
//                 <p className="text-gray-600">{feature.description}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>
//       {/* Why Teams Choose u8u.ai */}
//       <section className="py-20">
//         <div className="container mx-auto px-4">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl font-bold mb-3">
//               Why Teams Choose <span className="text-primary">u8u.ai</span>
//             </h2>
//             <p className="text-gray-500">A new standard for intelligent sales systems.</p>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="w-full border-collapse text-sm">
//               <thead>
//                 <tr>
//                   <th className="px-6 py-4 text-center text-black font-medium bg-gray-50 border-b">Capability</th>
//                   <th className="px-6 py-4 text-center text-black font-medium bg-gray-50 border-b">Automation</th>
//                   <th className="px-6 py-4 text-center text-black font-medium bg-gray-50 border-b">AI Tools</th>
//                   <th className="px-6 py-4 text-center text-black font-medium bg-gray-50 border-b">u8u.ai</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {[
//                   ['Understands customer intent', '✕', '⚠', '✓ Intelligent AI'],
//                   ['Real-time decision making', 'Rule-based', 'Basic', '✓ Dynamic AI'],
//                   ['Handles objections', '✕', 'Weak', '✓ Human-like'],
//                   ['Guides buying decision', '✕', 'Partial', '✓ Smart guidance'],
//                   ['Closes deals', '✕', '✕', '✓ Revenue-focused'],
//                   ['Multi-channel support', '✕', 'Partial', '✓ Full coverage'],
//                   ['Complete system', '✕', '✕', '✓ End-to-End'],
//                   ['Lead auto-qualification', 'Partial', 'Weak', '✓ BANT scoring'],
//                   ['Voice AI calling', '✕', '✕', '✓ Native support'],
//                   ['Works 24/7 autonomously', '✕', 'Partial', '✓ Always on'],
//                 ].map(([capability, auto, aiTools, u8u], i) => (
//                   <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
//                     <td className="px-6 py-3 text-gray-700 border-b text-center">{capability}</td>
//                     <td className="px-6 py-3 text-center border-b">
//                       <span className={auto === '✕' ? 'text-red-500' : auto === '⚠' ? 'text-yellow-500' : 'text-yellow-600 text-l font-medium'}>{auto}</span>
//                     </td>
//                     <td className="px-6 py-3 text-center border-b">
//                       <span className={aiTools === '✕' ? 'text-red-500' : 'text-yellow-600 text-l font-medium'}>{aiTools}</span>
//                     </td>
//                     <td className="px-6 py-3 text-center  border-b ">
//                       <span className="text-violet-600 text-l font-bold">{u8u}</span>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </section>
//       <footer className="border-t py-8 text-center text-gray-500">
//         <p>© {new Date().getFullYear()} Fuelo Technologies (OPC) Private Limited. Built for Startups.</p>
//       </footer>

//     </div>
//   );
// }