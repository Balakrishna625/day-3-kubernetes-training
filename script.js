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
            yaml: `# 🏢 ENTERPRISE SCENARIO: Global E-Commerce Platform
# Context: Black Friday Sale - Need to run payment processing 
# with specific Java configurations for high performance

apiVersion: v1
kind: Pod
metadata:
  name: payment-processor-black-friday
  namespace: payments-production
  labels:
    app: payment-processor
    tier: critical-business
    event: black-friday-2025
    cost-center: "revenue-systems"
  annotations:
    description: "Handles peak 50K transactions/min during Black Friday"
    owner: "payments-team@company.com"
    incident-channel: "#payments-oncall"
spec:
  serviceAccountName: payment-processor-sa
  priorityClassName: critical-business-workload  # Gets highest priority
  
  containers:
  - name: payment-api
    image: company-registry.io/payments/processor:v3.2.1-blackfriday
    
    # CUSTOM COMMAND: Override default Java startup
    command: ["/usr/bin/java"]
    args:
      # JVM Memory Settings (8GB heap for high throughput)
      - "-Xmx8g"
      - "-Xms8g"
      - "-XX:MaxMetaspaceSize=512m"
      # Garbage Collection Tuning (low-latency G1GC)
      - "-XX:+UseG1GC"
      - "-XX:MaxGCPauseMillis=200"
      - "-XX:ParallelGCThreads=8"
      # Performance Monitoring
      - "-XX:+PrintGCDetails"
      - "-XX:+PrintGCDateStamps"
      - "-Dcom.sun.management.jmxremote"
      - "-Dcom.sun.management.jmxremote.port=9010"
      # Application Properties
      - "-Dspring.profiles.active=blackfriday"
      - "-Dserver.port=8080"
      - "-jar"
      - "/app/payment-processor.jar"
    
    ports:
    - name: http
      containerPort: 8080
    - name: jmx
      containerPort: 9010
    
    env:
    - name: DB_CONNECTION_POOL_SIZE
      value: "200"  # Increased for Black Friday
    - name: CACHE_ENABLED
      value: "true"
    - name: FRAUD_CHECK_TIMEOUT_MS
      value: "500"
    - name: DATABASE_PASSWORD
      valueFrom:
        secretKeyRef:
          name: payment-db-credentials
          key: password
    
    resources:
      requests:
        cpu: "4000m"      # 4 full CPU cores reserved
        memory: "10Gi"    # 10GB RAM reserved
      limits:
        cpu: "8000m"      # Can burst to 8 cores
        memory: "12Gi"    # Hard limit 12GB
    
    livenessProbe:
      httpGet:
        path: /actuator/health/liveness
        port: 8080
      initialDelaySeconds: 60
      periodSeconds: 10
      failureThreshold: 3
    
    readinessProbe:
      httpGet:
        path: /actuator/health/readiness
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 5
      failureThreshold: 2

# 📊 Why This Matters:
# - Same Docker image works in dev, staging, production
# - Production uses optimized JVM args for performance
# - Development uses different args for faster startup/debugging
# - Black Friday config: More memory, aggressive GC tuning
# - Normal days: Standard settings (saves costs)`,
            flow: `<div class="flow-step">🏪 <strong>Business Context:</strong> Black Friday - Processing 50,000 payment transactions per minute</div>
<div class="flow-step">🚀 <strong>Step 1:</strong> Kubernetes starts pod with CRITICAL priority (can evict lower priority pods if needed)</div>
<div class="flow-step">☕ <strong>Step 2:</strong> Overrides default Java command with production-optimized JVM settings</div>
<div class="flow-step">💾 <strong>Step 3:</strong> Allocates 8GB heap memory with G1 garbage collector (low latency for payments)</div>
<div class="flow-step">🔧 <strong>Step 4:</strong> Sets GC pause target to 200ms (fast payment processing without freezes)</div>
<div class="flow-step">🔌 <strong>Step 5:</strong> Enables JMX monitoring on port 9010 for real-time performance tracking</div>
<div class="flow-step">⚙️ <strong>Step 6:</strong> Activates "blackfriday" Spring profile (special configs for peak traffic)</div>
<div class="flow-step">🔐 <strong>Step 7:</strong> Loads database password from Kubernetes Secret (security best practice)</div>
<div class="flow-step">💰 <strong>Result:</strong> Handles peak load smoothly - Revenue protected during biggest sales event!</div>
<div class="flow-step" style="background: linear-gradient(135deg, #4caf50, #66bb6a);"><strong>💡 Key Insight:</strong> Same container image, different behavior through command/args! Dev uses basic settings, production uses optimized settings.</div>`
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
        literal: `# Create ConfigMap with simple key-value pairs
kubectl create configmap app-settings \\
  --from-literal=APP_NAME="MyWebsite" \\
  --from-literal=MAX_USERS=100 \\
  --from-literal=DEBUG_MODE=true

# The YAML looks like this:
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-settings
data:
  APP_NAME: "MyWebsite"
  MAX_USERS: "100"        # All values are strings
  DEBUG_MODE: "true"

# Use in your app code:
# Python: app_name = os.environ['APP_NAME']
# Node.js: const appName = process.env.APP_NAME;`,
        
        file: `# 📋 EXAMPLE: Create ConfigMap from File

# Step 1: Create a config file
cat > app.conf <<EOF
database_host=postgres-db
port=5432
max_connections=100
EOF

# Step 2: Create ConfigMap from file
kubectl create configmap app-file-config --from-file=app.conf

# Step 3: YAML representation
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-file-config
data:
  app.conf: |
    database_host=postgres-db
    port=5432
    max_connections=100`,
        
        env: `# 🔌 EXAMPLE: Use ConfigMap as Environment Variables

apiVersion: v1
kind: Pod
metadata:
  name: web-app
spec:
  containers:
  - name: app
    image: myapp:v1
    env:
    - name: DB_HOST
      valueFrom:
        configMapKeyRef:
          name: app-settings
          key: APP_NAME
    - name: MAX_CONN
      valueFrom:
        configMapKeyRef:
          name: app-settings
          key: MAX_USERS

# Inside container, use as environment variables:
# echo $DB_HOST
# echo $MAX_CONN`,
        
        volume: `# 📁 EXAMPLE: Mount ConfigMap as Files

apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: myapp
    image: myapp:v1
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config
  
  volumes:
  - name: config-volume
    configMap:
      name: app-file-config

# Result inside container:
# /etc/config/app.conf contains the config file data
# Your app can read: open('/etc/config/app.conf', 'r')`,
        
        realworld: `# � REAL-WORLD EXAMPLE: Food Delivery Mobile App
# Context: Same app code runs in Development and Production
# Need: Different configurations for each environment

---
# 🧪 DEVELOPMENT ENVIRONMENT ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: foodapp-config
  namespace: development
  labels:
    app: food-delivery
    env: development
data:
  # App Settings
  APP_NAME: "FoodApp Dev"
  APP_ENV: "development"
  API_PORT: "3000"
  LOG_LEVEL: "debug"
  
  # Database Settings (Test Database)
  DB_HOST: "postgres-dev.default.svc.cluster.local"
  DB_PORT: "5432"
  DB_NAME: "foodapp_dev"
  DB_MAX_CONNECTIONS: "10"
  
  # Payment Gateway (Sandbox/Test Mode)
  PAYMENT_API_URL: "https://sandbox.stripe.com/v1"
  PAYMENT_MODE: "test"
  
  # Cache Settings (Disabled in Dev)
  CACHE_ENABLED: "false"
  REDIS_HOST: "redis-dev.default.svc.cluster.local"
  
  # Feature Flags
  ENABLE_PROMO_CODES: "true"
  ENABLE_LIVE_TRACKING: "false"
  ENABLE_PUSH_NOTIFICATIONS: "false"
  
  # External Services
  SMS_SERVICE_URL: "https://test-sms-api.com"
  EMAIL_SERVICE_URL: "https://test-email-api.com"
  MAPS_API_KEY: "dev-maps-api-key-123"

---
# 🚀 PRODUCTION ENVIRONMENT ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: foodapp-config
  namespace: production
  labels:
    app: food-delivery
    env: production
data:
  # App Settings
  APP_NAME: "FoodApp"
  APP_ENV: "production"
  API_PORT: "8080"
  LOG_LEVEL: "info"
  
  # Database Settings (Real Production Database)
  DB_HOST: "postgres-prod.default.svc.cluster.local"
  DB_PORT: "5432"
  DB_NAME: "foodapp_production"
  DB_MAX_CONNECTIONS: "100"
  
  # Payment Gateway (Live Mode)
  PAYMENT_API_URL: "https://api.stripe.com/v1"
  PAYMENT_MODE: "live"
  
  # Cache Settings (Enabled for Performance)
  CACHE_ENABLED: "true"
  REDIS_HOST: "redis-prod.default.svc.cluster.local"
  
  # Feature Flags
  ENABLE_PROMO_CODES: "true"
  ENABLE_LIVE_TRACKING: "true"
  ENABLE_PUSH_NOTIFICATIONS: "true"
  
  # External Services
  SMS_SERVICE_URL: "https://api.twilio.com"
  EMAIL_SERVICE_URL: "https://api.sendgrid.com"
  MAPS_API_KEY: "prod-maps-api-key-xyz-secure"

---
# � THE DEPLOYMENT (Same YAML for both environments!)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: food-delivery-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: food-delivery
  template:
    metadata:
      labels:
        app: food-delivery
    spec:
      containers:
      - name: api
        image: mycompany/food-delivery-app:v2.1.0
        
        # Inject ALL config as environment variables
        envFrom:
        - configMapRef:
            name: foodapp-config
        
        ports:
        - containerPort: 8080
        
        resources:
          requests:
            cpu: "250m"
            memory: "512Mi"
          limits:
            cpu: "1000m"
            memory: "1Gi"

# 📝 How Your Node.js/Python App Code Uses These:
# 
# const dbHost = process.env.DB_HOST;
# const paymentUrl = process.env.PAYMENT_API_URL;
# const cacheEnabled = process.env.CACHE_ENABLED === 'true';
# const logLevel = process.env.LOG_LEVEL;

# 💡 MAGIC: Same deployment YAML works in both namespaces!
# Just apply to different namespace:
#   kubectl apply -f deployment.yaml -n development
#   kubectl apply -f deployment.yaml -n production
# 
# ConfigMap name is same: "foodapp-config"
# But content is different per namespace!

# ✅ BENEFITS:
# 1. Same Docker image everywhere (no rebuilds)
# 2. Dev uses test database, Prod uses real database
# 3. Dev uses sandbox payments, Prod uses live payments  
# 4. Enable/disable features per environment
# 5. Change config without changing code
# 6. Easy to add staging environment - just new ConfigMap!`
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
        opaque: `# Opaque Secrets (most common type for generic sensitive data)

# Method 1: Create from literal values
kubectl create secret generic db-credentials \\
  --from-literal=username=admin \\
  --from-literal=password='SecureP@ssw0rd123!' \\
  --from-literal=database=products_db

# Method 2: Create from files
echo -n 'admin' > ./username.txt
echo -n 'SecureP@ssw0rd123!' > ./password.txt
kubectl create secret generic db-credentials \\
  --from-file=./username.txt \\
  --from-file=./password.txt

# Method 3: YAML manifest (values must be base64 encoded)
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
  namespace: production
  labels:
    app: product-api
    component: database
type: Opaque
data:
  username: YWRtaW4=                    # base64 of "admin"
  password: U2VjdXJlUEBzc3cwcmQxMjMh    # base64 of "SecureP@ssw0rd123!"
  database: cHJvZHVjdHNfZGI=            # base64 of "products_db"

# Note: To encode manually:
# echo -n 'admin' | base64     → YWRtaW4=
# To decode:
# echo 'YWRtaW4=' | base64 -d  → admin

---
# Using the Secret in a Pod
apiVersion: v1
kind: Pod
metadata:
  name: database-client
spec:
  containers:
  - name: client
    image: postgres:14
    env:
    # Individual env vars from secret
    - name: PGUSER
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: username
    - name: PGPASSWORD
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: password
    - name: PGDATABASE
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: database
    # All values are automatically decoded from base64`,
        
        docker: `# Docker Registry Secret (for pulling images from private registries)

# Create docker-registry secret
kubectl create secret docker-registry regcred \\
  --docker-server=https://my-registry.company.com \\
  --docker-username=deploy-bot \\
  --docker-password='R3giStryP@ss!' \\
  --docker-email=deploy@company.com \\
  --namespace=production

# YAML representation:
apiVersion: v1
kind: Secret
metadata:
  name: regcred
  namespace: production
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: eyJhdXRocyI6eyJodHRwczovL215LXJlZ2lzdHJ5...
  # This contains base64 encoded Docker config JSON

---
# Use in Pod to pull private images
apiVersion: v1
kind: Pod
metadata:
  name: private-app-pod
  namespace: production
spec:
  containers:
  - name: app
    image: my-registry.company.com/myapp:v1.2.3
    ports:
    - containerPort: 8080
  imagePullSecrets:
  - name: regcred  # Reference the docker-registry secret

---
# Use in ServiceAccount (all pods using this SA get the secret)
apiVersion: v1
kind: ServiceAccount
metadata:
  name: deployment-sa
  namespace: production
imagePullSecrets:
- name: regcred

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deployment
spec:
  replicas: 3
  template:
    spec:
      serviceAccountName: deployment-sa  # Automatically uses regcred
      containers:
      - name: app
        image: my-registry.company.com/myapp:v1.2.3`,
        
        tls: `# TLS Secret (for HTTPS/SSL certificates)

# Method 1: Create from certificate files
kubectl create secret tls webapp-tls \\
  --cert=path/to/tls.crt \\
  --key=path/to/tls.key \\
  --namespace=production

# Method 2: YAML manifest
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
    - www.example.com
    - api.example.com
    secretName: webapp-tls  # Reference TLS secret
  rules:
  - host: www.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: webapp-service
            port:
              number: 80

---
# Use in Pod for mutual TLS (mTLS)
apiVersion: v1
kind: Pod
metadata:
  name: secure-app
spec:
  containers:
  - name: app
    image: myapp:v1.0
    volumeMounts:
    - name: tls-certs
      mountPath: /etc/tls
      readOnly: true
    env:
    - name: TLS_CERT_FILE
      value: "/etc/tls/tls.crt"
    - name: TLS_KEY_FILE
      value: "/etc/tls/tls.key"
  volumes:
  - name: tls-certs
    secret:
      secretName: webapp-tls
      defaultMode: 0400  # Read-only for owner

# Files available in container:
# /etc/tls/tls.crt
# /etc/tls/tls.key`,
        
        token: `# Service Account Token Secret (mostly legacy, see bounded tokens)

# Legacy approach (pre-1.21)
apiVersion: v1
kind: Secret
metadata:
  name: build-robot-secret
  annotations:
    kubernetes.io/service-account.name: build-robot
type: kubernetes.io/service-account-token

# Kubernetes automatically populates:
# data:
#   ca.crt: <base64 encoded ca>
#   namespace: <base64 encoded namespace>
#   token: <base64 encoded token>

---
# Modern approach: Projected Service Account Token (recommended)
apiVersion: v1
kind: Pod
metadata:
  name: app-with-bounded-token
spec:
  serviceAccountName: my-app-sa
  containers:
  - name: app
    image: myapp:v1.0
    volumeMounts:
    - name: service-account-token
      mountPath: /var/run/secrets/tokens
      readOnly: true
  volumes:
  - name: service-account-token
    projected:
      sources:
      - serviceAccountToken:
          path: token
          expirationSeconds: 3600  # 1 hour TTL
          audience: api             # Audience bound

# Benefits of projected tokens:
# ✅ Time-limited (auto-rotated)
# ✅ Audience-specific  
# ✅ Pod-bound (invalid when pod deleted)
# ✅ More secure than legacy tokens`,
        
        comparison: `# When to Use Secret vs ConfigMap?

┌─────────────────────────────────────────────────────────────┐
│                    USE CONFIGMAP WHEN:                      │
├─────────────────────────────────────────────────────────────┤
│ ✅ Data is non-sensitive                                    │
│    - API endpoints, URLs                                    │
│    - Feature flags, toggles                                 │
│    - Application settings                                   │
│    - Cache configurations                                   │
│    - Log levels, debug settings                             │
│                                                              │
│ ✅ Data can be visible in Git/version control               │
│ ✅ Multiple teams need read access                          │
│ ✅ Data changes frequently                                  │
│ ✅ You want easy visibility for debugging                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     USE SECRET WHEN:                        │
├─────────────────────────────────────────────────────────────┤
│ 🔐 Data is sensitive                                        │
│    - Passwords, API keys                                    │
│    - OAuth tokens, JWT secrets                              │
│    - Database credentials                                   │
│    - TLS certificates and private keys                      │
│    - SSH keys                                               │
│    - Encryption keys                                        │
│                                                              │
│ 🔐 Data should NOT be in Git                                │
│ 🔐 Access needs to be strictly controlled (RBAC)            │
│ 🔐 You need audit trail of who accessed what                │
│ 🔐 Compliance requirements (PCI-DSS, HIPAA, etc.)           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│          USE EXTERNAL SECRET MANAGER WHEN:                  │
├─────────────────────────────────────────────────────────────┤
│ 🏢 Production environment with compliance needs             │
│ 🏢 Need automatic secret rotation                           │
│ 🏢 Centralized secret management across services            │
│ 🏢 Integration with cloud providers:                        │
│    - AWS Secrets Manager / AWS Systems Manager             │
│    - Azure Key Vault                                        │
│    - Google Secret Manager                                  │
│    - HashiCorp Vault                                        │
│ 🏢 Need secret versioning and rollback                      │
│ 🏢 Advanced features: dynamic secrets, encryption as service│
└─────────────────────────────────────────────────────────────┘

# Example Decision Tree:
# 
# Q: Is it a password, key, or token?
#    NO  → ConfigMap ✅
#    YES → Continue...
#
# Q: Is it for production?
#    NO  → Kubernetes Secret (with encryption at rest) ✅
#    YES → Continue...
#
# Q: Do you have compliance requirements?
#    YES → External Secret Manager ✅
#    NO  → Kubernetes Secret (minimum: encryption at rest) ✅`
    };
    
    yamlDisplay.textContent = examples[type];
}

// Service Account Demo
function showSAExample(type) {
    const yamlDisplay = document.getElementById('sa-yaml');
    
    const examples = {
        create: `# Create a Service Account
kubectl create serviceaccount jenkins-deployer -n cicd

# YAML representation:
apiVersion: v1
kind: ServiceAccount
metadata:
  name: jenkins-deployer
  namespace: cicd
  labels:
    app: jenkins
    role: deployer
# Kubernetes automatically creates:
# - A token (for API authentication)
# - Image pull secrets (if configured)

# Every namespace has a "default" ServiceAccount
kubectl get serviceaccounts -n default

# NAME      SECRETS   AGE
# default   1         30d`,
        
        pod: `# Using Service Account in Pod
apiVersion: v1
kind: Pod
metadata:
  name: api-pod
  namespace: production
spec:
  serviceAccountName: my-service-account
  # If not specified, uses "default" ServiceAccount
  
  containers:
  - name: api
    image: myapi:v1.0
    # Token automatically mounted at:
    # /var/run/secrets/kubernetes.io/serviceaccount/token
    # /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    # /var/run/secrets/kubernetes.io/serviceaccount/namespace
    
# Inside the container, your app can:
# 1. Read the token file
# 2. Use it to authenticate API requests
# 3. Call Kubernetes API with permissions granted via RBAC

---
# Disable auto-mounting if pod doesn't need API access
apiVersion: v1
kind: Pod
metadata:
  name: frontend-pod
spec:
  automountServiceAccountToken: false  # Security best practice!
  containers:
  - name: frontend
    image: nginx:1.21
    # This pod doesn't need to talk to API server`,
        
        token: `# Modern Approach: Projected Service Account Token (Bound Tokens)
apiVersion: v1
kind: Pod
metadata:
  name: app-with-projected-token
  namespace: production
  labels:
    app: payment-service
spec:
  serviceAccountName: payment-sa
  containers:
  - name: payment-api
    image: payment-api:v2.1.0
    volumeMounts:
    - name: sa-token
      mountPath: /var/run/secrets/tokens
      readOnly: true
    - name: service-account
      mountPath: /var/run/secrets/kubernetes.io/serviceaccount
      readOnly: true
    env:
    - name: TOKEN_PATH
      value: "/var/run/secrets/tokens/api-token"
  volumes:
  - name: sa-token
    projected:
      sources:
      - serviceAccountToken:
          path: api-token
          expirationSeconds: 3600      # 1 hour TTL
          audience: https://kubernetes.default.svc
          # Token only valid for this audience
  - name: service-account
    projected:
      sources:
      - serviceAccountToken:
          path: token
          expirationSeconds: 600       # 10 minutes for short tasks
      - configMap:
          name: kube-root-ca.crt
          items:
          - key: ca.crt
            path: ca.crt
      - downwardAPI:
          items:
          - path: namespace
            fieldRef:
              fieldPath: metadata.namespace

# Benefits:
# ✅ Token expires after 1 hour (configurable)
# ✅ Automatically rotated by kubelet before expiry
# ✅ Bound to specific pod (invalid after pod deletion)
# ✅ Audience-bound (only works with specified API)
# ✅ Significantly reduces security risk vs legacy tokens`,
        
        rbac: `# Complete Example: ServiceAccount + RBAC

---
# Step 1: Create ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: log-reader-sa
  namespace: production
  labels:
    component: monitoring

---
# Step 2: Create Role (what can be done)
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-log-reader
  namespace: production
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list"]
  # Can read pods and their logs
- apiGroups: [""]
  resources: ["pods/status"]
  verbs: ["get"]
  # Can check pod status

---
# Step 3: Create RoleBinding (who can do it)
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pod-logs
  namespace: production
subjects:
- kind: ServiceAccount
  name: log-reader-sa
  namespace: production
roleRef:
  kind: Role
  name: pod-log-reader
  apiGroup: rbac.authorization.k8s.io

---
# Step 4: Deploy Pod using ServiceAccount
apiVersion: apps/v1
kind: Deployment
metadata:
  name: log-aggregator
  namespace: production
spec:
  replicas: 1
  selector:
    matchLabels:
      app: log-aggregator
  template:
    metadata:
      labels:
        app: log-aggregator
    spec:
      serviceAccountName: log-reader-sa
      containers:
      - name: aggregator
        image: log-aggregator:v1.0
        env:
        - name: NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "256Mi"

# This pod can:
# ✅ List all pods in "production" namespace
# ✅ Read logs from any pod in "production"
# ✅ Check pod status
# ❌ Cannot delete, create, or update pods
# ❌ Cannot access other namespaces
# ❌ Cannot access secrets or configmaps`,
        
        fullexample: `# Real-World Complete Example: CI/CD Bot with Limited Permissions

---
# ServiceAccount for deployment automation
apiVersion: v1
kind: ServiceAccount
metadata:
  name: deployment-bot
  namespace: cicd
  labels:
    component: automation
    team: platform
automountServiceAccountToken: false  # We'll use projected tokens

---
# ClusterRole for deployment operations (cluster-wide)
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: deployment-manager
rules:
# Can manage deployments
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "create", "update", "patch", "delete"]
# Can manage services
- apiGroups: [""]
  resources: ["services"]
  verbs: ["get", "list", "create", "update", "patch"]
# Can read pods (for status checks)
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list"]
# Can manage configmaps (for deployments)
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list", "create", "update"]
# Can read namespaces
- apiGroups: [""]
  resources: ["namespaces"]
  verbs: ["get", "list"]

---
# ClusterRoleBinding (allow in specific namespaces only)
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: deployment-bot-binding
  namespace: development  # Only in development namespace
subjects:
- kind: ServiceAccount
  name: deployment-bot
  namespace: cicd
roleRef:
  kind: ClusterRole
  name: deployment-manager
  apiGroup: rbac.authorization.k8s.io

---
# Pod running the deployment automation
apiVersion: v1
kind: Pod
metadata:
  name: deployment-bot
  namespace: cicd
spec:
  serviceAccountName: deployment-bot
  automountServiceAccountToken: false
  
  containers:
  - name: bot
    image: deployment-bot:v1.5.0
    command: ["/app/deploy-bot"]
    args:
      - "--target-namespace=development"
      - "--token-path=/var/run/secrets/tokens/api-token"
      - "--dry-run=false"
    volumeMounts:
    - name: api-token
      mountPath: /var/run/secrets/tokens
      readOnly: true
    - name: ca-cert
      mountPath: /var/run/secrets/kubernetes.io/serviceaccount
      readOnly: true
    env:
    - name: KUBERNETES_SERVICE_HOST
      value: "kubernetes.default.svc"
    - name: KUBERNETES_SERVICE_PORT
      value: "443"
    resources:
      requests:
        cpu: "200m"
        memory: "256Mi"
      limits:
        cpu: "500m"
        memory: "512Mi"
        
  volumes:
  - name: api-token
    projected:
      sources:
      - serviceAccountToken:
          path: api-token
          expirationSeconds: 7200  # 2 hours
          audience: https://kubernetes.default.svc
  - name: ca-cert
    projected:
      sources:
      - configMap:
          name: kube-root-ca.crt
          items:
          - key: ca.crt
            path: ca.crt

  restartPolicy: Always

# Security Features:
# ✅ Dedicated ServiceAccount (not default)
# ✅ Least privilege (only deployment permissions)
# ✅ Namespace-restricted (only development)
# ✅ Time-limited tokens (2 hour expiry)
# ✅ No unnecessary permissions (can't access secrets)
# ✅ Audit trail (all actions logged)

# Test permissions:
# kubectl auth can-i create deployments --as=system:serviceaccount:cicd:deployment-bot -n development  # yes
# kubectl auth can-i delete secrets --as=system:serviceaccount:cicd:deployment-bot -n development     # no
# kubectl auth can-i create deployments --as=system:serviceaccount:cicd:deployment-bot -n production  # no`
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

// Resource Quotas and Limit Ranges
function showResourceTab(type) {
    const yamlDisplay = document.getElementById('resource-tab-yaml');
    
    // Update active tab
    const tabs = document.querySelectorAll('#resources .demo-tabs .tab-btn');
    tabs.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const examples = {
        quota: `# Resource Quota - Namespace Level Limits
# Purpose: Limit total resource consumption in a namespace

apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
  namespace: development
spec:
  hard:
    # Total CPU/Memory limits
    requests.cpu: "10"              # Max 10 CPU cores total (requests)
    requests.memory: 20Gi           # Max 20GB RAM total (requests)
    limits.cpu: "20"                # Max 20 CPU cores total (limits)
    limits.memory: 40Gi             # Max 40GB RAM total (limits)
    
    # Object count limits
    pods: "50"                      # Max 50 pods
    services: "10"                  # Max 10 services
    persistentvolumeclaims: "20"    # Max 20 PVCs
    secrets: "100"                  # Max 100 secrets
    configmaps: "100"               # Max 100 configmaps
    
    # Storage limits
    requests.storage: 100Gi         # Max 100GB storage total

---
# Check quota usage
# kubectl describe resourcequota compute-quota -n development

# NAME            AGE   REQUEST                                                  LIMIT
# compute-quota   1d    pods: 23/50, services: 5/10,                            
#                       requests.cpu: 5500m/10, requests.memory: 12Gi/20Gi,     
#                       limits.cpu: 11/20, limits.memory: 24Gi/40Gi

# What happens when quota exceeded:
# - New pod creation fails with "exceeded quota" error
# - kubectl create/apply returns error
# - Developers must either:
#   1. Delete unused resources
#   2. Reduce resource requests
#   3. Request quota increase from admin

# Example error:
# Error from server (Forbidden): pods "my-pod" is forbidden: 
# exceeded quota: compute-quota, requested: requests.cpu=2, 
# used: requests.cpu=9, limited: requests.cpu=10`,
        
        limitrange: `# Limit Range - Pod/Container Level Constraints  
# Purpose: Set defaults and enforce min/max per pod/container

apiVersion: v1
kind: LimitRange
metadata:
  name: resource-constraints
  namespace: production
spec:
  limits:
  
  # Container-level limits
  - type: Container
    max:
      cpu: "2"                      # No container can request > 2 CPU
      memory: 2Gi                   # No container can request > 2GB
    min:
      cpu: "100m"                   # Every container must request >= 100m CPU
      memory: 64Mi                  # Every container must request >= 64MB
    default:                        # Applied if no limit specified
      cpu: "500m"
      memory: 512Mi
    defaultRequest:                 # Applied if no request specified
      cpu: "250m"
      memory: 256Mi
    maxLimitRequestRatio:           # Limit can be max 4x the request
      cpu: "4"
      memory: "4"
  
  # Pod-level limits (sum of all containers)
  - type: Pod
    max:
      cpu: "4"                      # Pod's total requests can't exceed 4 CPU
      memory: 4Gi                   # Pod's total requests can't exceed 4GB
  
  # PersistentVolumeClaim limits
  - type: PersistentVolumeClaim
    max:
      storage: 50Gi                 # Max 50GB per PVC
    min:
      storage: 1Gi                  # Min 1GB per PVC

---
# Example: What gets applied

# Scenario 1: No resources specified
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: app
    image: nginx
    # NO resources specified
    
# LimitRange automatically applies:
# resources:
#   requests:
#     cpu: "250m"      # defaultRequest
#     memory: 256Mi
#   limits:
#     cpu: "500m"      # default
#     memory: 512Mi

---
# Scenario 2: Only request specified
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: app
    image: nginx
    resources:
      requests:
        cpu: "300m"
        memory: 300Mi
    # NO limits specified
    
# LimitRange applies default limits:
# resources:
#   requests:
#     cpu: "300m"      # User specified (kept)
#     memory: 300Mi
#   limits:
#     cpu: "500m"      # Default limit applied
#     memory: 512Mi

---
# Scenario 3: Violates constraints
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: app
    image: nginx
    resources:
      requests:
        cpu: "3"       # Exceeds max (2 CPU)
        memory: 256Mi
      limits:
        cpu: "3"
        memory: 512Mi

# Result: Pod creation REJECTED
# Error: Pod "app" is invalid: spec.containers[0].resources.requests: 
# Invalid value: "3": must be less than or equal to cpu limit`,
        
        comparison: `# When to Use What? Decision Guide

┌────────────────────────────────────────────────────────────────┐
│                    RESOURCE QUOTA                              │
│                  (Namespace-Level Limits)                      │
├────────────────────────────────────────────────────────────────┤
│ USE WHEN:                                                      │
│ ✅ Managing multi-tenant clusters                             │
│ ✅ Limiting total resources per team/project                  │
│ ✅ Cost management and chargeback                             │
│ ✅ Preventing namespace from consuming entire cluster         │
│ ✅ Enforcing organizational policies                          │
│                                                                │
│ EXAMPLE SCENARIOS:                                             │
│ • "Dev team can use max 20 CPU cores total"                   │
│ • "Test namespace limited to 50 pods"                         │
│ • "Each customer namespace: 10 CPU, 20GB RAM"                 │
│                                                                │
│ ENFORCEMENT:                                                   │
│ • Blocks creation if quota would be exceeded                  │
│ • Tracks cumulative usage across all resources                │
│ • Admin must increase quota for more resources                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                     LIMIT RANGE                                │
│              (Per-Pod/Container Constraints)                   │
├────────────────────────────────────────────────────────────────┤
│ USE WHEN:                                                      │
│ ✅ Enforcing minimum resource requests (prevent tiny pods)    │
│ ✅ Enforcing maximum limits (prevent huge pods)               │
│ ✅ Setting sensible defaults for developers                   │
│ ✅ Preventing misconfiguration                                │
│ ✅ Standardizing resource patterns                            │
│                                                                │
│ EXAMPLE SCENARIOS:                                             │
│ • "Every container must request at least 100m CPU"            │
│ • "No single pod can request more than 4GB RAM"               │
│ • "Default 256MB memory if not specified"                     │
│                                                                │
│ ENFORCEMENT:                                                   │
│ • Rejects pods violating constraints                          │
│ • Automatically applies defaults                              │
│ • Validates each pod/container individually                   │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                   POD RESOURCES                                │
│                 (requests & limits)                            │
├────────────────────────────────────────────────────────────────┤
│ USE WHEN:                                                      │
│ ✅ You know your application's resource needs                 │
│ ✅ Ensuring proper scheduling                                 │
│ ✅ Guaranteeing resources for critical apps                   │
│ ✅ Preventing resource starvation                             │
│ ✅ Achieving specific QoS class                               │
│                                                                │
│ EXAMPLE SCENARIOS:                                             │
│ • "Payment API needs guaranteed 2 CPU + 4GB RAM"              │
│ • "Batch job can burst to 4 CPU if available"                 │
│ • "Database requires consistent performance"                  │
│                                                                │
│ ENFORCEMENT:                                                   │
│ • Scheduler uses requests for placement decisions             │
│ • Limits enforced by kubelet on the node                      │
│ • QoS class determines eviction priority                      │
└────────────────────────────────────────────────────────────────┘


# RECOMMENDED APPROACH: Use All Three Together!

┌─────────────────────────────────────────────────────────────┐
│  1. Set LimitRange in namespace (defaults + constraints)   │
│     ↓                                                       │
│  2. Set ResourceQuota in namespace (total limits)           │
│     ↓                                                       │
│  3. Set specific resources in critical Deployments          │
└─────────────────────────────────────────────────────────────┘

# Example Complete Setup:

# 1. LimitRange: Developers don't have to think about it
#    - Defaults applied automatically
#    - Can't create ridiculously large pods
#    - Can't create tiny inefficient pods

# 2. ResourceQuota: Prevent namespace from hogging cluster
#    - Total cap on team's consumption
#    - Enables cost tracking
#    - Fair share enforcement

# 3. Pod Resources: Fine-tune critical workloads
#    - Production apps get Guaranteed QoS
#    - Dev/test can be BestEffort
#    - Optimize based on actual usage`,
        
        realworld: `# Real-World Example: Production Namespace Setup

---
# Step 1: Create LimitRange (Sets defaults and constraints)
apiVersion: v1
kind: LimitRange
metadata:
  name: prod-limit-range
  namespace: production
spec:
  limits:
  - type: Container
    max:
      cpu: "4"
      memory: 8Gi
    min:
      cpu: "50m"
      memory: 32Mi
    default:
      cpu: "500m"
      memory: 512Mi
    defaultRequest:
      cpu: "250m"
      memory: 256Mi
    maxLimitRequestRatio:
      cpu: "4"
      memory: "2"

---
# Step 2: Create ResourceQuota (Limits total usage)
apiVersion: v1
kind: ResourceQuota
metadata:
  name: prod-quota
  namespace: production
spec:
  hard:
    requests.cpu: "50"
    requests.memory: 100Gi
    limits.cpu: "100"
    limits.memory: 200Gi
    pods: "100"
    services.loadbalancers: "5"
    persistentvolumeclaims: "50"

---
# Step 3: Critical App with Guaranteed QoS
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-api
  namespace: production
  labels:
    app: payment-api
    tier: critical
spec:
  replicas: 3
  selector:
    matchLabels:
      app: payment-api
  template:
    metadata:
      labels:
        app: payment-api
    spec:
      serviceAccountName: payment-sa
      containers:
      - name: api
        image: payment-api:v2.1.0
        resources:
          requests:
            cpu: "2"           # Guaranteed QoS
            memory: 4Gi        # Request = Limit
          limits:
            cpu: "2"
            memory: 4Gi
        ports:
        - containerPort: 8080
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
          initialDelaySeconds: 10
          periodSeconds: 5

# Resource Usage Calculation:
# Per pod: 2 CPU, 4GB RAM
# 3 replicas: 6 CPU, 12GB RAM
# Namespace usage: 6/50 CPU, 12/100 GB RAM
# QoS: Guaranteed (highest priority)

---
# Step 4: Regular App with Burstable QoS
apiVersion: apps/v1
kind: Deployment
metadata:
  name: catalog-api
  namespace: production
  labels:
    app: catalog-api
    tier: standard
spec:
  replicas: 2
  selector:
    matchLabels:
      app: catalog-api
  template:
    metadata:
      labels:
        app: catalog-api
    spec:
      containers:
      - name: api
        image: catalog-api:v1.5.0
        resources:
          requests:
            cpu: "500m"        # Burstable QoS
            memory: 512Mi      # Can burst to limits
          limits:
            cpu: "2"           # Can use up to 2 CPU
            memory: 2Gi        # Can use up to 2GB
        # LimitRange already set defaults, but we override for this app

# Resource Usage:
# Per pod: 500m CPU (can burst to 2), 512MB (can burst to 2GB)
# 2 replicas: 1 CPU request, 4 CPU limit
# Namespace usage: 7/50 CPU requests, 16/100 CPU limits
# QoS: Burstable (medium priority)

---
# Step 5: Batch Job with BestEffort QoS
apiVersion: batch/v1
kind: CronJob
metadata:
  name: cleanup-job
  namespace: production
spec:
  schedule: "0 2 * * *"  # 2 AM daily
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: cleanup
            image: cleanup-script:v1.0
            # NO resources specified
            # Gets LimitRange defaults: 250m CPU, 256Mi memory
          restartPolicy: OnFailure

# Resource Usage:
# Uses LimitRange defaults
# QoS: Burstable (gets defaults from LimitRange)
# Runs at night when cluster is less busy

---
# Monitoring Quota Usage
# kubectl describe resourcequota prod-quota -n production
# kubectl describe limitrange prod-limit-range -n production
# kubectl top pods -n production
# kubectl get pods -n production -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.qosClass}{"\n"}{end}'

# Result:
# payment-api-xxx    Guaranteed
# catalog-api-xxx    Burstable  
# cleanup-job-xxx    Burstable`
    };
    
    yamlDisplay.textContent = examples[type];
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
    showResourceTab('quota');
    
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

// Visual Flow Animations
let configMapFlowState = 'initial'; // initial, created, attached

function animateConfigMapFlow(action) {
    const configMapBox = document.getElementById('configMapBox');
    const podBox = document.getElementById('podBox');
    const arrow = document.getElementById('flowArrow');
    const status = document.getElementById('flowStatus');
    
    if (action === 'create') {
        if (configMapFlowState !== 'initial') {
            status.innerHTML = '<span class="status-icon">⚠️</span> Reset first to create again!';
            return;
        }
        
        // Animate ConfigMap creation
        configMapBox.style.opacity = '1';
        configMapBox.classList.add('creating');
        
        status.innerHTML = '<span class="status-icon">✨</span> ConfigMap "app-config" created successfully!';
        
        setTimeout(() => {
            configMapBox.classList.remove('creating');
            configMapFlowState = 'created';
        }, 600);
        
    } else if (action === 'attach') {
        if (configMapFlowState !== 'created') {
            status.innerHTML = '<span class="status-icon">⚠️</span> Create ConfigMap first!';
            return;
        }
        
        // Show arrow animation
        arrow.classList.add('active');
        status.innerHTML = '<span class="status-icon">🔄</span> Attaching ConfigMap to Pod...';
        
        setTimeout(() => {
            // Animate attachment
            configMapBox.classList.add('attaching');
            podBox.classList.add('attaching');
            
            setTimeout(() => {
                configMapBox.classList.remove('attaching');
                podBox.classList.remove('attaching');
                podBox.classList.add('attached');
                
                status.innerHTML = '<span class="status-icon success">✅</span> ConfigMap successfully attached to Pod! App can now read configuration.';
                status.classList.add('success');
                
                configMapFlowState = 'attached';
            }, 1000);
        }, 500);
        
    } else if (action === 'reset') {
        // Reset everything
        configMapBox.style.opacity = '0';
        configMapBox.classList.remove('creating', 'attaching', 'attached');
        podBox.classList.remove('attaching', 'attached');
        arrow.classList.remove('active');
        status.classList.remove('success');
        status.innerHTML = 'Ready to start the animation';
        configMapFlowState = 'initial';
    }
}

// Secret Flow Animation
let secretFlowState = 'initial'; // initial, created, injected

function animateSecretFlow(action) {
    const secretBox = document.getElementById('secretBox');
    const podBox = document.getElementById('secretPodBox');
    const arrow = document.getElementById('secretFlowArrow');
    const status = document.getElementById('secretFlowStatus');
    
    if (action === 'create') {
        if (secretFlowState !== 'initial') {
            status.innerHTML = '<span class="status-icon">⚠️</span> Reset first to create again!';
            return;
        }
        
        // Animate Secret creation
        secretBox.style.opacity = '1';
        secretBox.classList.add('creating');
        
        status.innerHTML = '<span class="status-icon">🔐</span> Secret "db-credentials" created (Base64 encoded)';
        
        setTimeout(() => {
            secretBox.classList.remove('creating');
            secretFlowState = 'created';
        }, 600);
        
    } else if (action === 'inject') {
        if (secretFlowState !== 'created') {
            status.innerHTML = '<span class="status-icon">⚠️</span> Create Secret first!';
            return;
        }
        
        // Show arrow animation
        arrow.classList.add('active');
        status.innerHTML = '<span class="status-icon">🔒</span> Injecting Secret securely into Pod...';
        
        setTimeout(() => {
            // Animate injection
            secretBox.classList.add('attaching');
            podBox.classList.add('attaching');
            
            setTimeout(() => {
                secretBox.classList.remove('attaching');
                podBox.classList.remove('attaching');
                podBox.classList.add('attached');
                
                status.innerHTML = '<span class="status-icon success">✅</span> Secret securely injected! Pod can access credentials via environment variables.';
                status.classList.add('success');
                
                secretFlowState = 'injected';
            }, 1000);
        }, 500);
        
    } else if (action === 'reset') {
        // Reset everything
        secretBox.style.opacity = '0';
        secretBox.classList.remove('creating', 'attaching', 'attached');
        podBox.classList.remove('attaching', 'attached');
        arrow.classList.remove('active');
        status.classList.remove('success');
        status.innerHTML = 'Ready to demonstrate secure secret injection';
        secretFlowState = 'initial';
    }
}

// Resource Flow Animation
let resourceFlowState = 'initial'; // initial, scheduled, allocated
let nodeUsage = 0; // percentage

function animateResourceFlow(action) {
    const podBox = document.getElementById('resourcePodBox');
    const nodeBox = document.getElementById('resourceNodeBox');
    const arrow = document.getElementById('resourceFlowArrow');
    const status = document.getElementById('resourceFlowStatus');
    const usageBar = document.getElementById('nodeUsageBar');
    const usageText = document.getElementById('nodeUsageText');
    const nodeResources = document.getElementById('nodeResources');
    
    if (action === 'schedule') {
        if (resourceFlowState !== 'initial') {
            status.innerHTML = '<span class="status-icon">⚠️</span> Reset first to schedule again!';
            return;
        }
        
        // Animate pod appearing
        podBox.style.opacity = '1';
        podBox.classList.add('creating');
        
        status.innerHTML = '<span class="status-icon">🔍</span> Scheduler searching for suitable node...';
        
        setTimeout(() => {
            podBox.classList.remove('creating');
            arrow.classList.add('active');
            status.innerHTML = '<span class="status-icon">✅</span> Node found! Pod assigned to node-1';
            resourceFlowState = 'scheduled';
        }, 800);
        
    } else if (action === 'allocate') {
        if (resourceFlowState !== 'scheduled') {
            status.innerHTML = '<span class="status-icon">⚠️</span> Schedule pod first!';
            return;
        }
        
        status.innerHTML = '<span class="status-icon">⚙️</span> Allocating resources from node...';
        
        setTimeout(() => {
            // Animate resource allocation
            podBox.classList.add('attaching');
            nodeBox.classList.add('attaching');
            
            // Update node usage
            nodeUsage = 25; // 500m/2000m = 25%
            usageBar.style.width = nodeUsage + '%';
            usageText.textContent = nodeUsage + '%';
            nodeResources.textContent = 'Available: 1500m CPU, 3.75Gi RAM';
            
            setTimeout(() => {
                podBox.classList.remove('attaching');
                podBox.classList.add('attached');
                nodeBox.classList.remove('attaching');
                
                status.innerHTML = '<span class="status-icon success">✅</span> Resources allocated! Pod running on node-1 (using 25% of node capacity)';
                status.classList.add('success');
                
                resourceFlowState = 'allocated';
            }, 1000);
        }, 600);
        
    } else if (action === 'addMore') {
        if (resourceFlowState !== 'allocated') {
            status.innerHTML = '<span class="status-icon">⚠️</span> Complete allocation first!';
            return;
        }
        
        status.innerHTML = '<span class="status-icon">➕</span> Adding 2 more pods to the same node...';
        
        setTimeout(() => {
            // Simulate adding more pods
            nodeUsage = 75; // 3 pods total
            usageBar.style.width = nodeUsage + '%';
            usageText.textContent = nodeUsage + '%';
            nodeResources.textContent = 'Available: 500m CPU, 3Gi RAM';
            
            nodeBox.classList.add('attaching');
            
            setTimeout(() => {
                nodeBox.classList.remove('attaching');
                status.innerHTML = '<span class="status-icon success">🎉</span> 3 pods now running! Node at 75% capacity. Resource management working!';
            }, 800);
        }, 600);
        
    } else if (action === 'reset') {
        // Reset everything
        podBox.style.opacity = '0';
        podBox.classList.remove('creating', 'attaching', 'attached');
        nodeBox.classList.remove('attaching', 'attached');
        arrow.classList.remove('active');
        status.classList.remove('success');
        status.innerHTML = 'Ready to demonstrate pod scheduling and resource allocation';
        resourceFlowState = 'initial';
        nodeUsage = 0;
        usageBar.style.width = '0%';
        usageText.textContent = '0%';
        nodeResources.textContent = 'Available: 2000m CPU, 4Gi RAM';
    }
}

