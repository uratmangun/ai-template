## 1. Free conflicting ports

- [x] 1.1 Identify the container currently binding port 5900 and rerun it on port 5901
- [x] 1.2 Remove any temporary noVNC or websockify process currently binding port 6080

## 2. Install and configure the host VNC stack

- [x] 2.1 Install host packages for virtual display, lightweight desktop, VNC server, and noVNC/websockify
- [x] 2.2 Configure the host services so a virtual desktop starts and a real VNC server listens on port 5900
- [x] 2.3 Configure the browser-access service so noVNC listens on port 6080 and proxies to the host VNC backend

## 3. Verify end-to-end access

- [x] 3.1 Confirm port 5900 responds as a VNC/RFB server
- [x] 3.2 Confirm `http://<IP_PLACEHOLDER>:6080/vnc.html` loads correctly in a browser
- [x] 3.3 Confirm the browser connect flow succeeds without the previous backend failure
