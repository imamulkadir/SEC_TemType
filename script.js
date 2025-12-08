function loadTemplate(name, pdfUrl, secUrl) {
  const placeholder = document.getElementById("viewer-placeholder");
  placeholder.innerHTML = ""; // Clear previous content

  // Create iframe for PDF
  const iframe = document.createElement("iframe");
  iframe.src = pdfUrl;
  iframe.className = "viewer-iframe";
  placeholder.appendChild(iframe);

  // Create button to visit SEC page
  const button = document.createElement("button");
  button.className = "visit-sec-btn";
  button.innerText = "Visit SEC Page";
  button.onclick = () => window.open(secUrl, "_blank");
  placeholder.appendChild(button);
}
