import React from 'react';
import { Skeleton } from 'boneyard-js/react';

export default function BoneyardFixtures() {
  return (
    <div style={{ padding: 40, background: '#131316', minHeight: '100vh', color: '#fff' }}>
      <h1>Boneyard Fixtures (Internal Crawler Use Only)</h1>
      
      <section style={{ marginBottom: 60, marginTop: 40 }}>
        <h2>template-preview</h2>
        <div style={{ width: '400px', height: '300px', border: '1px solid #333' }}>
             <Skeleton name="template-preview" loading={true}>
                 <div style={{ width: '100%', height: '100%', background: '#1c1c1c' }}>
                    <div style={{ height: 40, borderBottom: '1px solid #333' }} />
                    <div style={{ padding: 20 }}>
                        <div style={{ width: '80%', height: 20, background: '#2a2a2a', borderRadius: 4, marginBottom: 12 }} />
                        <div style={{ width: '60%', height: 16, background: '#2a2a2a', borderRadius: 4, marginBottom: 24 }} />
                        <div style={{ width: '100%', height: 120, background: '#222', borderRadius: 8 }} />
                    </div>
                 </div>
             </Skeleton>
        </div>
      </section>

      <section style={{ marginBottom: 60 }}>
        <h2>project-preview</h2>
        <div style={{ width: '380px', height: '260px' }}>
             <Skeleton name="project-preview" loading={true}>
                 <div style={{ background: '#1c1c1c', display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 8 }}>
                     <div style={{ height: 40, borderBottom: '1px solid #333' }} />
                     <div style={{ flex: 1, padding: 20 }}>
                         <div style={{ height: 100, background: '#2a2a2a', borderRadius: 8, marginBottom: 16 }} />
                         <div style={{ display: 'flex', gap: 12 }}>
                             <div style={{ flex: 1, height: 60, background: '#2a2a2a', borderRadius: 8 }} />
                             <div style={{ flex: 1, height: 60, background: '#2a2a2a', borderRadius: 8 }} />
                         </div>
                     </div>
                 </div>
             </Skeleton>
        </div>
      </section>

      <section style={{ marginBottom: 60 }}>
        <h2>privacy-settings</h2>
        <div style={{ maxWidth: 800 }}>
             <Skeleton name="privacy-settings" loading={true}>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ padding: '24px 0', borderBottom: '1px solid #222' }}>
                        <div style={{ width: 240, height: 18, background: '#333', borderRadius: 4, marginBottom: 8 }} />
                        <div style={{ width: 320, height: 14, background: '#222', borderRadius: 4 }} />
                    </div>
                    {[1,2,3,4,5,6].map(i => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #222' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ width: 180, height: 16, background: '#333', borderRadius: 4, marginBottom: 8 }} />
                                <div style={{ width: 280, height: 12, background: '#222', borderRadius: 4 }} />
                            </div>
                            <div style={{ width: 44, height: 24, background: '#333', borderRadius: 12 }} />
                        </div>
                    ))}
                 </div>
             </Skeleton>
        </div>
      </section>
    </div>
  )
}
