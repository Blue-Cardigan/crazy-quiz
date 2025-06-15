import Link from 'next/link'
import { ArrowRight, Users, Zap, Terminal, Database, Search, FileText, Cpu, Shield } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Section with ASCII Art and Terminal Aesthetic */}
      <section className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            
            {/* Main Content */}
            <div className="space-y-8 pr-0 lg:pr-96">
              <div className="space-y-4">
                <div className="text-accent-primary font-mono text-sm tracking-widest uppercase">
                  [ QUIZ ARCHIVE SYSTEM INITIALIZED ]
                </div>
                <h1 className="archive-header text-6xl lg:text-8xl text-accent-primary text-glow-strong leading-none">
                  DATA
                  <br />
                  <span className="text-accent-tertiary glitch">RETRIEVAL</span>
                  <br />
                  <span className="text-accent-secondary">PROTOCOL</span>
                </h1>
                <div className="space-y-3 text-text-dim font-mono text-lg">
                  <p className="data-point">Terminal-based quiz archival system</p>
                  <p className="data-point">Real-time knowledge verification protocols</p>
                  <p className="data-point">Distributed learning network access</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/quizzes"
                  className="btn-terminal flex items-center justify-center space-x-3 text-lg py-4 px-8"
                >
                  <Search className="h-5 w-5" />
                  <span>Browse Archive</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/auth/signup"
                  className="btn-secondary flex items-center justify-center space-x-3 text-lg py-4 px-8"
                >
                  <Terminal className="h-5 w-5" />
                  <span>Access Terminal</span>
                </Link>
              </div>

              {/* System Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-neutral-light">
                <div className="text-center">
                  <div className="text-3xl font-mono text-accent-primary text-glow">127</div>
                  <div className="text-xs text-text-dim font-mono uppercase tracking-wide">Active Nodes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-mono text-accent-tertiary text-glow">2.4K</div>
                  <div className="text-xs text-text-dim font-mono uppercase tracking-wide">Archive Entries</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-mono text-accent-secondary text-glow">98.7%</div>
                  <div className="text-xs text-text-dim font-mono uppercase tracking-wide">System Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Archival System Modules */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-neutral-dark/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-accent-primary font-mono text-sm tracking-widest uppercase mb-4">
              [ SYSTEM MODULES ]
            </div>
            <h2 className="archive-header text-4xl lg:text-6xl text-accent-primary text-glow mb-6">
              ARCHIVE PROTOCOLS
            </h2>
            <p className="text-text-dim font-mono text-lg max-w-3xl mx-auto">
              Advanced knowledge management system with distributed verification protocols
              and real-time data synchronization across secure network nodes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Database,
                title: "Data Archival",
                description: "Secure storage protocols with encrypted knowledge databases and redundant backup systems.",
                color: "accent-primary"
              },
              {
                icon: Cpu,
                title: "Query Processing",
                description: "High-performance search algorithms with intelligent content matching and relevance scoring.",
                color: "accent-tertiary"
              },
              {
                icon: Shield,
                title: "Access Control",
                description: "Multi-layer authentication system with role-based permissions and audit trail logging.",
                color: "accent-secondary"
              },
              {
                icon: Users,
                title: "Network Nodes",
                description: "Distributed user network with peer-to-peer knowledge sharing and collaborative verification.",
                color: "warning"
              },
              {
                icon: Zap,
                title: "Real-time Sync",
                description: "Instant data propagation across network nodes with conflict resolution algorithms.",
                color: "accent-primary"
              },
              {
                icon: FileText,
                title: "Report Generation",
                description: "Automated analytics and performance metrics with exportable data visualization.",
                color: "accent-tertiary"
              }
            ].map((feature, index) => (
              <div key={index} className="archive-card p-6 group">
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`p-3 rounded border border-${feature.color} text-${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-mono text-lg uppercase tracking-wide text-accent-primary">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-text-dim font-mono text-sm leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-4 text-xs font-mono text-accent-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  MODULE STATUS: ACTIVE
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Terminal Access */}
      <section className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10"></div>
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="space-y-8">
            <div>
              <div className="text-accent-primary font-mono text-sm tracking-widest uppercase mb-4">
                [ SYSTEM ACCESS REQUEST ]
              </div>
              <h2 className="archive-header text-4xl lg:text-6xl text-accent-primary text-glow-strong mb-6">
                INITIALIZE
                <br />
                <span className="text-accent-secondary">CONNECTION</span>
              </h2>
              <p className="text-text-dim font-mono text-lg max-w-2xl mx-auto">
                Begin your journey into the knowledge archive. Access terminal interface
                and contribute to the distributed learning network.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link
                href="/auth/signup"
                className="btn-terminal flex items-center justify-center space-x-3 text-xl py-6 px-12"
              >
                <Terminal className="h-6 w-6" />
                <span>Request Access</span>
              </Link>
              <Link
                href="/quizzes"
                className="btn-secondary flex items-center justify-center space-x-3 text-xl py-6 px-12"
              >
                <Database className="h-6 w-6" />
                <span>Browse Archive</span>
              </Link>
            </div>

            {/* Terminal Prompt */}
            <div className="archive-card p-6 text-left font-mono text-sm max-w-2xl mx-auto">
              <div className="text-accent-primary mb-2">$ quiz-sys --init-session</div>
              <div className="text-text-dim">Initializing secure connection...</div>
              <div className="text-text-dim">Loading user authentication protocols...</div>
              <div className="text-accent-primary">Ready for input_<span className="animate-pulse">█</span></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
