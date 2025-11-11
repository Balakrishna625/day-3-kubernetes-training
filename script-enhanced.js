// Helper function to format YAML with syntax highlighting
function formatYAML(yamlText) {
    // This will be displayed in the pre/code block with proper formatting
    return yamlText;
}

// Commands and Arguments Demo
function showExample(type) {
    const yamlDisplay = document.getElementById('command-yaml');
    const flowVisual = document.getElementById('execution-visual');
    
    const examples = {
        default: {
            yaml: `apiVersion: v1
kind: Pod
metadata:
  name: default-nginx-pod
  labels:
    app: web
spec:
  containers:
  - name: nginx
    image: nginx:1.21
    # No command or args specified
    # Uses Dockerfile defaults:
    # ENTRYPOINT: nginx -g daemon off;
    ports:
    - containerPort: 80`,
            flow: `<div class="flow-step">1. Container starts with default ENTRYPOINT from nginx image</div>
<div class="flow-step">2. Executes default CMD from Dockerfile</div>
<div class="flow-step">3. nginx process runs: "nginx -g daemon off;"</div>
<div class="flow-step">4. Listens on port 80 for HTTP requests</div>`
        },
        command: {
            yaml: `apiVersion: v1
kind: Pod
metadata:
  name: custom-command-pod
  labels:
    app: debug
spec:
  containers:
  - name: ubuntu-debug
    image: ubuntu:20.04
    command: ["/bin/bash"]
    # Overrides ENTRYPOINT completely
    # Original entrypoint is ignored
    # Container will start bash and exit immediately
    # (no args provided to keep it running)`,
            flow: `<div class="flow-step">1. Kubernetes overrides the image's ENTRYPOINT</div>
<div class="flow-step">2. Runs "/bin/bash" instead of default command</div>
<div class="flow-step">3. Bash starts but has no command to execute</div>
<div class="flow-step">4. Container exits immediately (CrashLoopBackOff)</div>
<div class="flow-step" style="background: linear-gradient(90deg, #f44336, #e91e63); margin-top:1rem;">⚠️ Problem: Need args to keep container running!</div>`
        },
        args: {
            yaml: `apiVersion: v1
kind: Pod
metadata:
  name: busybox-sleep-pod
  labels:
    app: utility
spec:
  containers:
  - name: busybox
    image: busybox:1.35
    args: ["sleep", "3600"]
    # Keeps default ENTRYPOINT (sh -c)
    # Overrides CMD with: sleep 3600
    # Final execution: sh -c "sleep 3600"
    resources:
      requests:
        cpu: "100m"
        memory: "64Mi"`,
            flow: `<div class="flow-step">1. Uses default ENTRYPOINT from busybox image (sh -c)</div>
<div class="flow-step">2. Overrides CMD with custom args: sleep 3600</div>
<div class="flow-step">3. Final command executed: sh -c "sleep 3600"</div>
<div class="flow-step">4. Container sleeps for 3600 seconds (1 hour)</div>
<div class="flow-step">5. Useful for keeping pod alive for debugging/testing</div>`
        },
        both: {
            yaml: `apiVersion: v1
kind: Pod
metadata:
  name: custom-startup-pod
  labels:
    app: custom
    env: dev
spec:
  containers:
  - name: custom-container
    image: ubuntu:20.04
    command: ["/bin/bash"]
    args: 
      - "-c"
      - |
        echo "Starting application..."
        echo "Environment: \${APP_ENV:-development}"
        echo "Timestamp: $(date)"
        # Your application startup logic here
        sleep infinity
    env:
    - name: APP_ENV
      value: "development"
    # Both command and args provide full control`,
            flow: `<div class="flow-step">1. Overrides ENTRYPOINT with /bin/bash</div>
<div class="flow-step">2. Passes args: -c "script commands..."</div>
<div class="flow-step">3. Prints startup messages to logs</div>
<div class="flow-step">4. Executes custom initialization logic</div>
<div class="flow-step">5. Sleeps indefinitely (container stays running)</div>
<div class="flow-step" style="background: linear-gradient(90deg, #4caf50, #8bc34a); margin-top:1rem;">✅ Full control: Custom executable + custom script</div>`
        },
        production: {
            yaml: `apiVersion: v1
kind: Pod
metadata:
  name: flask-api-production
  namespace: production
  labels:
    app: product-api
    tier: backend
    env: production
spec:
  serviceAccountName: api-service-account
  containers:
  - name: flask-app
    image: mycompany/product-api:v2.3.1
    command: ["/usr/local/bin/gunicorn"]
    args:
      - "--bind=0.0.0.0:8080"
      - "--workers=4"
      - "--threads=2"
      - "--timeout=60"
      - "--access-logfile=-"
      - "--error-logfile=-"
      - "--log-level=info"
      - "app:create_app()"
    ports:
    - name: http
      containerPort: 8080
      protocol: TCP
    env:
    - name: FLASK_ENV
      value: "production"
    - name: DATABASE_URL
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: connection-string
    resources:
      requests:
        cpu: "500m"
        memory: "512Mi"
      limits:
        cpu: "2000m"
        memory: "1Gi"
    livenessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 5`,
            flow: `<div class="flow-step">1. Overrides default Python command with Gunicorn (production WSGI server)</div>
<div class="flow-step">2. Configures 4 worker processes with 2 threads each (handles concurrency)</div>
<div class="flow-step">3. Sets production-grade timeouts and logging</div>
<div class="flow-step">4. Binds to port 8080 (non-root port for security)</div>
<div class="flow-step">5. Loads database credentials from Kubernetes Secret</div>
<div class="flow-step">6. Health checks ensure service reliability</div>
<div class="flow-step" style="background: linear-gradient(90deg, #2196f3, #03a9f4); margin-top:1rem;">🚀 Production-ready: Same image, production configuration!</div>`
        }
    };
    
    const example = examples[type];
    yamlDisplay.textContent = example.yaml;
    flowVisual.innerHTML = example.flow;
}

// ConfigMap Demo
function showConfigMapTab(type) {
    const yamlDisplay = document.getElementById('configmap-yaml');
    
    // Update active tab
    const tabs = document.querySelectorAll('#configmaps .demo-tabs .tab-btn');
    tabs.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const examples = {
        literal: `# Create ConfigMap from literal values (quick for simple configs)
kubectl create configmap app-config \\
  --from-literal=APP_ENV=production \\
  --from-literal=LOG_LEVEL=info \\
  --from-literal=MAX_CONNECTIONS=100 \\
  --from-literal=CACHE_TTL=3600

# View the created ConfigMap
kubectl get configmap app-config -o yaml

# Output YAML:
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: default
  labels:
    app: my-application
data:
  APP_ENV: production
  LOG_LEVEL: info
  MAX_CONNECTIONS: "100"      # Numbers stored as strings
  CACHE_TTL: "3600"

# Note: All values are strings in ConfigMaps`,
        
        file: `# Step 1: Create configuration files
cat > database.properties <<EOF
db.host=postgres.production.svc.cluster.local
db.port=5432
db.name=products_db
db.pool.min=5
db.pool.max=20
db.timeout=30
EOF

cat > redis.conf <<EOF
maxmemory 256mb
maxmemory-policy allkeys-lru
timeout 300
tcp-keepalive 60
EOF

# Step 2: Create ConfigMap from multiple files
kubectl create configmap app-config \\
  --from-file=database.properties \\
  --from-file=redis.conf \\
  --from-file=config-dir/

# Step 3: YAML representation
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
data:
  database.properties: |
    db.host=postgres.production.svc.cluster.local
    db.port=5432
    db.name=products_db
    db.pool.min=5
    db.pool.max=20
    db.timeout=30
  redis.conf: |
    maxmemory 256mb
    maxmemory-policy allkeys-lru
    timeout 300
    tcp-keepalive 60

# Use case: Complex configuration files (Java properties, Redis conf, etc.)`,
        
        env: `# Method 1: Inject ALL keys as environment variables
apiVersion: v1
kind: Pod
metadata:
  name: config-env-pod
  labels:
    app: web-api
spec:
  containers:
  - name: api-server
    image: myapi:v1.0
    envFrom:
    - configMapRef:
        name: app-config
    # All keys from app-config become env vars:
    # APP_ENV=production
    # LOG_LEVEL=info
    # MAX_CONNECTIONS=100

---
# Method 2: Inject SPECIFIC keys with custom names
apiVersion: v1
kind: Pod
metadata:
  name: selective-config-pod
spec:
  containers:
  - name: application
    image: myapp:v2.1
    env:
    - name: DATABASE_HOST
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: db.host
    - name: DATABASE_PORT
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: db.port
    - name: LOG_LEVEL
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: LOG_LEVEL
    # Choose which configs to expose and rename them
    
# Inside container:
# echo $DATABASE_HOST  → postgres.production.svc.cluster.local
# echo $LOG_LEVEL      → info`,
        
        volume: `# Mount ConfigMap as files in a directory
apiVersion: v1
kind: Pod
metadata:
  name: config-volume-pod
  namespace: production
spec:
  containers:
  - name: application
    image: java-app:v1.5
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config
      readOnly: true
    - name: database-config
      mountPath: /etc/database
      subPath: database.properties  # Mount only specific file
      readOnly: true
    command: ["java"]
    args:
      - "-jar"
      - "app.jar"
      - "--spring.config.location=/etc/config/"
  volumes:
  - name: config-volume
    configMap:
      name: app-config
      # Optional: Set file permissions
      defaultMode: 0644
      items:
      - key: redis.conf
        path: redis.conf
      - key: application.yaml
        path: application.yaml
  - name: database-config
    configMap:
      name: app-config

# Result inside container:
# /etc/config/redis.conf          → redis configuration
# /etc/config/application.yaml    → app configuration
# /etc/database/database.properties → database settings

# Advantage: Files update automatically when ConfigMap changes (with delay)`,
        
        realworld: `# Real-World: Multi-Environment Application Configuration
# Separate ConfigMaps for each environment

---
# Development Environment
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: development
  labels:
    env: development
data:
  application.yaml: |
    server:
      port: 8080
      debug: true
    database:
      host: postgres.development.svc.cluster.local
      pool_size: 5
    cache:
      enabled: false
    features:
      new_ui: true
      beta_features: true
    logging:
      level: DEBUG

---
# Production Environment  
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
  labels:
    env: production
data:
  application.yaml: |
    server:
      port: 8080
      debug: false
    database:
      host: postgres.production.svc.cluster.local
      pool_size: 20
    cache:
      enabled: true
      ttl: 3600
    features:
      new_ui: false        # Disabled in production
      beta_features: false
    logging:
      level: INFO

---
# Deployment using the ConfigMap (works in any namespace)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: product-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: product-api
  template:
    metadata:
      labels:
        app: product-api
    spec:
      containers:
      - name: api
        image: mycompany/product-api:v2.3.1
        volumeMounts:
        - name: config
          mountPath: /app/config
        env:
        - name: CONFIG_FILE
          value: "/app/config/application.yaml"
        resources:
          requests:
            cpu: "250m"
            memory: "256Mi"
          limits:
            cpu: "1000m"
            memory: "512Mi"
      volumes:
      - name: config
        configMap:
          name: app-config  # Same name, different values per namespace!

# Same deployment manifest works in both dev and production!
# Only difference is the namespace - configuration is automatically different`
    };
    
    yamlDisplay.textContent = examples[type];
}

// Secrets Demo
function encodeSecret() {
    const plainText = document.getElementById('plain-text').value;
    if (plainText) {
        const encoded = btoa(plainText);
        document.getElementById('encoded-text').value = encoded;
        try {
            const decoded = atob(encoded);
            document.getElementById('decoded-text').value = decoded;
        } catch (e) {
            document.getElementById('decoded-text').value = 'Error decoding';
        }
    } else {
        document.getElementById('encoded-text').value = '';
        document.getElementById('decoded-text').value = '';
    }
}

function showSecretType(type) {
    const yamlDisplay = document.getElementById('secret-yaml');
    
    // Update active tab
    const tabs = document.querySelectorAll('#secrets .demo-tabs .tab-btn');
    tabs.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const examples = {
        opaque: `# Simple Secret for Database Password

# Quick way: Create from command line
kubectl create secret generic db-secret \\
  --from-literal=password='MySecretPass123'

# Use in your application
apiVersion: v1
kind: Pod
metadata:
  name: my-app
spec:
  containers:
  - name: app
    image: nginx
    env:
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: password
    # Your app reads DB_PASSWORD as environment variable
    # Kubernetes decodes it automatically!`,
        
        docker: `# Pull Images from Private Docker Registry

# Create secret for registry login
kubectl create secret docker-registry my-registry \\
  --docker-server=mycompany.azurecr.io \\
  --docker-username=admin \\
  --docker-password='RegistryPass123'

# Use it to pull private images
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app
    image: mycompany.azurecr.io/my-app:v1
  imagePullSecrets:
  - name: my-registry  # Kubernetes uses this to login`,
        
        tls: `# HTTPS Certificate for Your Website

# Create from certificate files
kubectl create secret tls website-cert \\
  --cert=website.crt \\
  --key=website.key
apiVersion: v1
kind: Secret
metadata:
  name: webapp-tls
  namespace: production
  labels:
    app: webapp
type: kubernetes.io/tls
data:
  tls.crt: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t...  # base64 cert
  tls.key: LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVkt...  # base64 key

---
# Use in Ingress for HTTPS
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: webapp-ingress
  namespace: production
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:

# Use in Ingress for HTTPS
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-website
spec:
  tls:
  - hosts:
    - www.mysite.com
    secretName: website-cert
  rules:
  - host: www.mysite.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80`,
        
        token: `# Service Account Token (Auto-Created by Kubernetes)

# When you create a ServiceAccount, Kubernetes automatically
# creates a token secret for it

apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app-account

---
# Use in Pod
apiVersion: v1
kind: Pod
metadata:
  name: my-app
spec:
  serviceAccountName: my-app-account
  containers:
  - name: app
    image: nginx
    # Token automatically mounted at:
    # /var/run/secrets/kubernetes.io/serviceaccount/token
    # Your app can use this to talk to Kubernetes API`,
        
        comparison: `# Quick Guide: Secret vs ConfigMap

USE CONFIGMAP FOR:
✅ Non-sensitive data
   - API URLs, endpoints
   - Feature flags
   - App settings
   
USE SECRET FOR:
🔐 Sensitive data
   - Passwords
   - API keys  
   - Certificates

REMEMBER:
❌ ConfigMap = visible to everyone
🔒 Secret = Base64 encoded + access controlled`
    };
    
    yamlDisplay.textContent = examples[type];
}

// Service Account Demo
function showSAExample(type) {
    const yamlDisplay = document.getElementById('sa-yaml');
    
    const examples = {
        create: `# Create a Service Account
kubectl create serviceaccount my-app-account

# View it
kubectl get serviceaccounts

# Every pod needs an identity to talk to Kubernetes API
# Service Account = Identity for pods`,
        
        pod: `# Use Service Account in Pod
apiVersion: v1
kind: Pod
metadata:
  name: my-app
spec:
  serviceAccountName: my-app-account
  containers:
  - name: app
    image: nginx
    # Token auto-mounted at:
    # /var/run/secrets/kubernetes.io/serviceaccount/token`,
        
        token: `# Service Account Token (Auto-Created)
# When you create a ServiceAccount,
# Kubernetes automatically creates a token for it
# Your pod uses this token to authenticate with Kubernetes API

# Token location inside pod:
/var/run/secrets/kubernetes.io/serviceaccount/token

# Your app can read this token and use it!`,
        
        rbac: `# ServiceAccount + Permissions

---
# 1. Create ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: pod-reader

---
# 2. Give it permission to read pods
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader-role
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]

---
# 3. Connect ServiceAccount to Role
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
subjects:
- kind: ServiceAccount
  name: pod-reader
roleRef:
  kind: Role
  name: pod-reader-role
  apiGroup: rbac.authorization.k8s.io

---
# 4. Use in Pod
apiVersion: v1
kind: Pod
metadata:
  name: my-app
spec:
  serviceAccountName: pod-reader
  containers:
  - name: app
    image: nginx
    # This pod can now read pods!`,
        
        fullexample: `# Complete Example: Simple App with Permissions

---
# ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app

---
# Role (what it can do)
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: configmap-reader
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list"]

---
# RoleBinding (connect them)
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: app-can-read-configs
subjects:
- kind: ServiceAccount
  name: my-app
roleRef:
  kind: Role
  name: configmap-reader
  apiGroup: rbac.authorization.k8s.io

---
# Pod using it
apiVersion: v1
kind: Pod
metadata:
  name: my-app-pod
spec:
  serviceAccountName: my-app
  containers:
  - name: app
    image: nginx

# Result: This pod can read ConfigMaps!`
    };
    
    yamlDisplay.textContent = examples[type];
}

// Token Lifecycle Animation
function animateTokenLifecycle() {
    const items = document.querySelectorAll('.timeline-item');
    items.forEach(item => item.classList.remove('active'));
    
    items.forEach((item, index) => {
        setTimeout(() => {
            item.classList.add('active');
        }, index * 1200);  // Slower animation for better understanding
    });
}

// Resource Management
function updateResourceVisual() {
    const cpuRequest = parseInt(document.getElementById('cpu-request').value);
    const cpuLimit = parseInt(document.getElementById('cpu-limit').value);
    const memRequest = parseInt(document.getElementById('mem-request').value);
    const memLimit = parseInt(document.getElementById('mem-limit').value);
    
    // Update labels
    document.getElementById('cpu-request-val').textContent = cpuRequest + 'm';
    document.getElementById('cpu-limit-val').textContent = cpuLimit + 'm';
    document.getElementById('mem-request-val').textContent = memRequest + 'Mi';
    document.getElementById('mem-limit-val').textContent = memLimit + 'Mi';
    
    // Determine QoS Class
    let qosClass = '';
    let qosExplanation = '';
    
    if (cpuRequest == 0 && cpuLimit == 0 && memRequest == 0 && memLimit == 0) {
        qosClass = 'BestEffort';
        qosExplanation = 'No requests or limits set. Lowest priority - first to be evicted under resource pressure. Uses leftover resources only.';
    } else if (cpuRequest > 0 && memRequest > 0 && cpuRequest == cpuLimit && memRequest == memLimit) {
        qosClass = 'Guaranteed';
        qosExplanation = 'Requests equal limits for ALL resources. Highest priority - last to be evicted. Gets dedicated, predictable resources.';
    } else {
        qosClass = 'Burstable';
        qosExplanation = 'At least one resource has request < limit (or only request/limit set). Can burst above request up to limit. Medium priority for eviction.';
    }
    
    document.getElementById('qos-class').textContent = qosClass;
    document.getElementById('qos-explanation').textContent = qosExplanation;
    
    // Update YAML
    const yaml = `apiVersion: v1
kind: Pod
metadata:
  name: resource-demo-pod
  labels:
    app: demo
    qos: ${qosClass.toLowerCase()}
spec:
  containers:
  - name: application
    image: nginx:1.21
    resources:
      requests:
        cpu: "${cpuRequest}m"
        memory: "${memRequest}Mi"
      limits:
        cpu: "${cpuLimit}m"
        memory: "${memLimit}Mi"
    ports:
    - containerPort: 80

# QoS Class: ${qosClass}
# ${qosExplanation}

# Scheduler Behavior:
# - Looks for node with >= ${cpuRequest}m CPU and ${memRequest}Mi memory available
# - Reserves these resources for this pod
${cpuLimit > cpuRequest ? `# - Pod can burst up to ${cpuLimit}m CPU if node has capacity` : ''}
${memLimit > memRequest ? `# - Pod can use up to ${memLimit}Mi memory before being OOMKilled` : ''}

# What happens under pressure:
${qosClass === 'BestEffort' ? '# - Evicted FIRST when node runs low on memory' : ''}
${qosClass === 'Burstable' ? '# - Evicted AFTER BestEffort pods, BEFORE Guaranteed pods' : ''}
${qosClass === 'Guaranteed' ? '# - Evicted LAST - only if consuming more than request' : ''}`;
    
    document.getElementById('resource-yaml').textContent = yaml;
}

// Toggle Solution
function toggleSolution(id) {
    const solution = document.getElementById(id);
    const button = event.target;
    if (solution.style.display === 'none' || !solution.style.display) {
        solution.style.display = 'block';
        button.textContent = 'Hide Solution';
    } else {
        solution.style.display = 'none';
        button.textContent = 'Show Solution';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Show default examples
    showExample('default');
    showConfigMapTab('literal');
    showSecretType('opaque');
    showSAExample('create');
    updateResourceVisual();
    
    // Smooth scroll for navigation
    document.querySelectorAll('.nav-links a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Visual Flow Animations - Kubernetes-style with data transfer
window.configMapFlowState = 'initial';

window.animateConfigMapFlow = function(action) {
    const configMapBox = document.getElementById('configMapBox');
    const podBox = document.getElementById('podBox');
    const line = document.getElementById('configMapLine');
    const packet = document.getElementById('configMapPacket');
    const podInternal = document.getElementById('podInternal');
    const status = document.getElementById('flowStatus');
    
    if (action === 'create') {
        if (window.configMapFlowState !== 'initial') {
            status.innerHTML = '<span class="status-icon">⚠️</span> Reset first to create again!';
            return;
        }
        
        // Create ConfigMap with pop animation
        configMapBox.style.opacity = '1';
        configMapBox.classList.add('creating');
        status.innerHTML = '<span class="status-icon">✨</span> ConfigMap "app-config" created and stored in etcd!';
        
        setTimeout(() => {
            configMapBox.classList.remove('creating');
            window.configMapFlowState = 'created';
        }, 600);
        
    } else if (action === 'attach') {
        if (window.configMapFlowState !== 'created') {
            status.innerHTML = '<span class="status-icon">⚠️</span> Create ConfigMap first!';
            return;
        }
        
        status.innerHTML = '<span class="status-icon">🔄</span> Kubernetes mounting ConfigMap into Pod...';
        
        // Show connection line
        line.classList.add('active');
        
        setTimeout(() => {
            // Send data packet
            packet.classList.add('moving');
            
            setTimeout(() => {
                // Pod receives the config
                podBox.classList.add('receiving');
                podBox.classList.add('connected');
                podInternal.classList.add('active');
                
                setTimeout(() => {
                    podBox.classList.remove('receiving');
                    status.innerHTML = '<span class="status-icon success">✅</span> ConfigMap mounted! Pod can read config as env vars or files.';
                    status.classList.add('success');
                    window.configMapFlowState = 'attached';
                }, 600);
            }, 1500);
        }, 800);
        
    } else if (action === 'reset') {
        configMapBox.style.opacity = '0';
        configMapBox.classList.remove('creating', 'receiving', 'connected');
        podBox.classList.remove('receiving', 'connected');
        line.classList.remove('active');
        packet.classList.remove('moving');
        podInternal.classList.remove('active');
        status.classList.remove('success');
        status.innerHTML = 'Ready to start the animation';
        window.configMapFlowState = 'initial';
        
        // Reset packet position
        setTimeout(() => {
            packet.style.left = '0';
        }, 100);
    }
}

// Secret Flow Animation
window.secretFlowState = 'initial';

window.animateSecretFlow = function(action) {
    const secretBox = document.getElementById('secretBox');
    const podBox = document.getElementById('secretPodBox');
    const line = document.getElementById('secretLine');
    const packet = document.getElementById('secretPacket');
    const podInternal = document.getElementById('secretPodInternal');
    const status = document.getElementById('secretFlowStatus');
    
    if (action === 'create') {
        if (window.secretFlowState !== 'initial') {
            status.innerHTML = '<span class="status-icon">⚠️</span> Reset first to create again!';
            return;
        }
        
        // Create Secret with pop animation
        secretBox.style.opacity = '1';
        secretBox.classList.add('creating');
        status.innerHTML = '<span class="status-icon">🔐</span> Secret "db-credentials" created (Base64 encoded, stored in etcd)';
        
        setTimeout(() => {
            secretBox.classList.remove('creating');
            window.secretFlowState = 'created';
        }, 600);
        
    } else if (action === 'inject') {
        if (window.secretFlowState !== 'created') {
            status.innerHTML = '<span class="status-icon">⚠️</span> Create Secret first!';
            return;
        }
        
        status.innerHTML = '<span class="status-icon">🔒</span> Kubernetes securely injecting Secret into Pod...';
        
        // Show connection line
        line.classList.add('active');
        
        setTimeout(() => {
            // Send encrypted data packet
            packet.classList.add('moving');
            
            setTimeout(() => {
                // Pod receives the secret
                podBox.classList.add('receiving');
                podBox.classList.add('connected');
                podInternal.classList.add('active');
                
                setTimeout(() => {
                    podBox.classList.remove('receiving');
                    status.innerHTML = '<span class="status-icon success">✅</span> Secret injected securely! Pod accesses via env vars (decoded at runtime).';
                    status.classList.add('success');
                    window.secretFlowState = 'injected';
                }, 600);
            }, 1500);
        }, 800);
        
    } else if (action === 'reset') {
        secretBox.style.opacity = '0';
        secretBox.classList.remove('creating', 'receiving', 'connected');
        podBox.classList.remove('receiving', 'connected');
        line.classList.remove('active');
        packet.classList.remove('moving');
        podInternal.classList.remove('active');
        status.classList.remove('success');
        status.innerHTML = 'Ready to demonstrate secure secret injection';
        window.secretFlowState = 'initial';
        
        setTimeout(() => {
            packet.style.left = '0';
        }, 100);
    }
}

// Resource Flow Animation
window.resourceFlowState = 'initial';
window.nodeUsage = 0;

window.animateResourceFlow = function(action) {
    const podBox = document.getElementById('resourcePodBox');
    const nodeBox = document.getElementById('resourceNodeBox');
    const line = document.getElementById('resourceLine');
    const packet = document.getElementById('resourcePacket');
    const status = document.getElementById('resourceFlowStatus');
    const usageBar = document.getElementById('nodeUsageBar');
    const usageText = document.getElementById('nodeUsageText');
    const nodeResources = document.getElementById('nodeResources');
    
    if (action === 'schedule') {
        if (window.resourceFlowState !== 'initial') {
            status.innerHTML = '<span class="status-icon">⚠️</span> Reset first to schedule again!';
            return;
        }
        
        // Pod appears (created by user/deployment)
        podBox.style.opacity = '1';
        podBox.classList.add('creating');
        status.innerHTML = '<span class="status-icon">🔍</span> Scheduler finding node with 500m CPU + 256Mi RAM available...';
        
        setTimeout(() => {
            podBox.classList.remove('creating');
            line.classList.add('active');
            status.innerHTML = '<span class="status-icon">✅</span> Node found! Scheduler assigned pod to node-1';
            window.resourceFlowState = 'scheduled';
        }, 1000);
        
    } else if (action === 'allocate') {
        if (window.resourceFlowState !== 'scheduled') {
            status.innerHTML = '<span class="status-icon">⚠️</span> Schedule pod first!';
            return;
        }
        
        status.innerHTML = '<span class="status-icon">⚙️</span> Kubelet reserving 500m CPU and 256Mi RAM on node...';
        
        // Send resource reservation packet
        packet.classList.add('moving');
        
        setTimeout(() => {
            // Node receives and allocates
            nodeBox.classList.add('receiving');
            window.nodeUsage = 25;
            usageBar.style.width = '25%';
            usageText.textContent = '25%';
            nodeResources.innerHTML = 'Available:<br>1500m CPU, 3.75Gi RAM';
            
            setTimeout(() => {
                nodeBox.classList.remove('receiving');
                nodeBox.classList.add('connected');
                podBox.classList.add('connected');
                
                status.innerHTML = '<span class="status-icon success">✅</span> Resources allocated! Pod running (guaranteed 500m CPU, 256Mi RAM)';
                status.classList.add('success');
                window.resourceFlowState = 'allocated';
            }, 600);
        }, 1500);
        
    } else if (action === 'addMore') {
        if (window.resourceFlowState !== 'allocated') {
            status.innerHTML = '<span class="status-icon">⚠️</span> Complete allocation first!';
            return;
        }
        
        status.innerHTML = '<span class="status-icon">➕</span> Deploying 2 more pods (same requests: 500m CPU, 256Mi RAM each)...';
        
        setTimeout(() => {
            nodeBox.classList.add('receiving');
            
            setTimeout(() => {
                window.nodeUsage = 75;
                usageBar.style.width = '75%';
                usageText.textContent = '75%';
                nodeResources.innerHTML = 'Available:<br>500m CPU, 3Gi RAM';
                nodeBox.classList.remove('receiving');
                
                status.innerHTML = '<span class="status-icon success">🎉</span> 3 pods running! Node at 75% capacity (1500m/2000m CPU used)';
            }, 800);
        }, 600);
        
    } else if (action === 'reset') {
        podBox.style.opacity = '0';
        podBox.classList.remove('creating', 'receiving', 'connected');
        nodeBox.classList.remove('receiving', 'connected');
        line.classList.remove('active');
        packet.classList.remove('moving');
        status.classList.remove('success');
        status.innerHTML = 'Ready to demonstrate pod scheduling and resource allocation';
        window.resourceFlowState = 'initial';
        window.nodeUsage = 0;
        usageBar.style.width = '0%';
        usageText.textContent = '0%';
        nodeResources.innerHTML = 'Available:<br>2000m CPU, 4Gi RAM';
        
        setTimeout(() => {
            packet.style.left = '0';
        }, 100);
    }
}

// QoS Eviction Simulation
window.qosPressureLevel = 0;

window.simulateNodePressure = function() {
    const memoryBar = document.getElementById('qosMemoryBar');
    const memoryText = document.getElementById('qosNodeMemory');
    const pressureStatus = document.getElementById('qosPressureStatus');
    const status = document.getElementById('qosEvictionStatus');
    
    window.qosPressureLevel++;
    
    if (window.qosPressureLevel === 1) {
        // 70% memory - evict BestEffort pods
        memoryBar.style.width = '70%';
        memoryBar.style.background = '#FF9800';
        memoryText.textContent = '5.6Gi / 8Gi';
        pressureStatus.textContent = 'Status: Memory Pressure!';
        pressureStatus.style.color = '#FF9800';
        
        status.innerHTML = '<span class="status-icon">⚠️</span> Memory at 70%! Evicting BestEffort pods...';
        
        // Evict BestEffort pods (Pod 1 and 2)
        setTimeout(() => {
            const pod1 = document.getElementById('qosPod1');
            pod1.classList.add('evicting');
            
            setTimeout(() => {
                pod1.classList.remove('evicting');
                pod1.classList.add('evicted');
                pod1.innerHTML = '<div style="font-size: 1.5rem;">❌</div><div style="font-weight: bold; margin-top: 0.5rem; color: #ff5252;">EVICTED</div><div style="font-size: 0.75rem; color: #999;">Pod 1</div>';
                status.innerHTML = '<span class="status-icon">❌</span> Pod 1 (BestEffort) evicted!';
            }, 500);
        }, 500);
        
        setTimeout(() => {
            const pod2 = document.getElementById('qosPod2');
            pod2.classList.add('evicting');
            
            setTimeout(() => {
                pod2.classList.remove('evicting');
                pod2.classList.add('evicted');
                pod2.innerHTML = '<div style="font-size: 1.5rem;">❌</div><div style="font-weight: bold; margin-top: 0.5rem; color: #ff5252;">EVICTED</div><div style="font-size: 0.75rem; color: #999;">Pod 2</div>';
                status.innerHTML = '<span class="status-icon">❌</span> Pod 2 (BestEffort) evicted! All BestEffort pods removed.';
            }, 500);
        }, 1500);
        
    } else if (window.qosPressureLevel === 2) {
        // 85% memory - evict Burstable pods
        memoryBar.style.width = '85%';
        memoryBar.style.background = '#ff5252';
        memoryText.textContent = '6.8Gi / 8Gi';
        pressureStatus.textContent = 'Status: Critical Pressure!';
        pressureStatus.style.color = '#ff5252';
        
        status.innerHTML = '<span class="status-icon">🚨</span> Memory at 85%! Evicting Burstable pods...';
        
        // Evict Burstable pods (Pod 3 and 4)
        setTimeout(() => {
            const pod3 = document.getElementById('qosPod3');
            pod3.classList.add('evicting');
            
            setTimeout(() => {
                pod3.classList.remove('evicting');
                pod3.classList.add('evicted');
                pod3.innerHTML = '<div style="font-size: 1.5rem;">❌</div><div style="font-weight: bold; margin-top: 0.5rem; color: #ff5252;">EVICTED</div><div style="font-size: 0.75rem; color: #999;">Pod 3</div>';
                status.innerHTML = '<span class="status-icon">❌</span> Pod 3 (Burstable) evicted!';
            }, 500);
        }, 500);
        
        setTimeout(() => {
            const pod4 = document.getElementById('qosPod4');
            pod4.classList.add('evicting');
            
            setTimeout(() => {
                pod4.classList.remove('evicting');
                pod4.classList.add('evicted');
                pod4.innerHTML = '<div style="font-size: 1.5rem;">❌</div><div style="font-weight: bold; margin-top: 0.5rem; color: #ff5252;">EVICTED</div><div style="font-size: 0.75rem; color: #999;">Pod 4</div>';
                status.innerHTML = '<span class="status-icon">❌</span> Pod 4 (Burstable) evicted! Only Guaranteed pod remains.';
            }, 500);
        }, 1500);
        
    } else if (window.qosPressureLevel === 3) {
        // 95% memory - even Guaranteed pod at risk
        memoryBar.style.width = '95%';
        memoryBar.style.background = '#d32f2f';
        memoryText.textContent = '7.6Gi / 8Gi';
        pressureStatus.textContent = 'Status: EXTREME PRESSURE!';
        pressureStatus.style.color = '#d32f2f';
        
        status.innerHTML = '<span class="status-icon">💀</span> Memory at 95%! Even Guaranteed pod at risk...';
        
        setTimeout(() => {
            const pod5 = document.getElementById('qosPod5');
            pod5.classList.add('evicting');
            
            setTimeout(() => {
                pod5.classList.remove('evicting');
                pod5.classList.add('evicted');
                pod5.innerHTML = '<div style="font-size: 1.5rem;">❌</div><div style="font-weight: bold; margin-top: 0.5rem; color: #ff5252;">EVICTED</div><div style="font-size: 0.75rem; color: #999;">Pod 5</div>';
                status.innerHTML = '<span class="status-icon">💀</span> Pod 5 (Guaranteed) evicted! Node has no pods left. Add more nodes!';
                memoryBar.style.width = '30%';
                memoryBar.style.background = '#4CAF50';
                memoryText.textContent = '2.4Gi / 8Gi';
                pressureStatus.textContent = 'Status: Normal (all pods gone)';
                pressureStatus.style.color = '#4CAF50';
            }, 500);
        }, 1000);
        
    } else {
        status.innerHTML = '<span class="status-icon">ℹ️</span> All pods evicted. Click Reset to start again.';
    }
}

window.resetQoSDemo = function() {
    window.qosPressureLevel = 0;
    
    const memoryBar = document.getElementById('qosMemoryBar');
    const memoryText = document.getElementById('qosNodeMemory');
    const pressureStatus = document.getElementById('qosPressureStatus');
    const status = document.getElementById('qosEvictionStatus');
    
    memoryBar.style.width = '50%';
    memoryBar.style.background = '#4CAF50';
    memoryText.textContent = '4Gi / 8Gi';
    pressureStatus.textContent = 'Status: Normal';
    pressureStatus.style.color = '#4CAF50';
    status.innerHTML = 'Ready to simulate node memory pressure';
    
    // Reset all pods with original content
    const pod1 = document.getElementById('qosPod1');
    pod1.classList.remove('evicting', 'evicted');
    pod1.style.display = '';
    pod1.innerHTML = '<div style="font-size: 1.5rem;">📦</div><div style="font-weight: bold; margin-top: 0.5rem;">Pod 1</div><div style="font-size: 0.85rem; color: #ff5252;">BestEffort</div>';
    
    const pod2 = document.getElementById('qosPod2');
    pod2.classList.remove('evicting', 'evicted');
    pod2.style.display = '';
    pod2.innerHTML = '<div style="font-size: 1.5rem;">📦</div><div style="font-weight: bold; margin-top: 0.5rem;">Pod 2</div><div style="font-size: 0.85rem; color: #ff5252;">BestEffort</div>';
    
    const pod3 = document.getElementById('qosPod3');
    pod3.classList.remove('evicting', 'evicted');
    pod3.style.display = '';
    pod3.innerHTML = '<div style="font-size: 1.5rem;">📦</div><div style="font-weight: bold; margin-top: 0.5rem;">Pod 3</div><div style="font-size: 0.85rem; color: #FFC107;">Burstable</div>';
    
    const pod4 = document.getElementById('qosPod4');
    pod4.classList.remove('evicting', 'evicted');
    pod4.style.display = '';
    pod4.innerHTML = '<div style="font-size: 1.5rem;">📦</div><div style="font-weight: bold; margin-top: 0.5rem;">Pod 4</div><div style="font-size: 0.85rem; color: #FFC107;">Burstable</div>';
    
    const pod5 = document.getElementById('qosPod5');
    pod5.classList.remove('evicting', 'evicted');
    pod5.style.display = '';
    pod5.innerHTML = '<div style="font-size: 1.5rem;">📦</div><div style="font-weight: bold; margin-top: 0.5rem;">Pod 5</div><div style="font-size: 0.85rem; color: #4CAF50;">Guaranteed</div>';
}

