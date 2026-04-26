// This is your React component file (e.g., StreamlitView.js)

export default function StreamlitView() {
    return (
        <div className="container">
            {/* --- THE IFRAME TAG GOES HERE --- */}
            <iframe
                src="http://localhost:8501/?embedded=true"
                width="100%"
                height="600px"
                style={{ border: "none" }}
            ></iframe>
            {/* ---------------------------------- */}
        </div>
    );
}