import { Wind } from 'lucide-react'
import { Link } from 'react-router-dom'
import './EditorPage.css'

export default function EditorPage() {
    return (
        <div className="editor-page">
            <div className="editor-placeholder">
                <div className="editor-placeholder-icon">
                    <Wind size={32} />
                </div>
                <h2>INDIFORGE AI Editor</h2>
                <p>Monaco Editor + Live Preview will be built here (Day 11-12)</p>
                <Link to="/dashboard" className="editor-back-link">
                    ← Back to Dashboard
                </Link>
            </div>
        </div>
    )
}
