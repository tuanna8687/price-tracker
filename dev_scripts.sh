#!/bin/bash

# Price Tracker Development Scripts
# Usage: ./dev-scripts.sh [command]

set -e

PROJECT_NAME="price-tracker"
COMPOSE_FILE="docker-compose.dev.yml"

case "$1" in
    "start")
        echo "🚀 Starting Price Tracker development environment..."
        docker-compose -f $COMPOSE_FILE up -d
        echo "✅ Development environment started!"
        echo ""
        echo "📋 Available services:"
        echo "   - Development workspace: docker exec -it price-tracker-dev bash"
        echo "   - Database: localhost:5433 (user: devuser, pass: devpass123)"
        echo "   - Redis: localhost:6380"
        echo "   - Adminer (DB GUI): http://localhost:8080"
        echo "   - Redis Commander: http://localhost:8081"
        echo ""
        echo "🔧 Next steps:"
        echo "   1. Enter development container: ./dev-scripts.sh shell"
        echo "   2. Create backend: ./dev-scripts.sh create-backend"
        echo "   3. Create frontend: ./dev-scripts.sh create-frontend"
        ;;
    
    "stop")
        echo "🛑 Stopping Price Tracker development environment..."
        docker-compose -f $COMPOSE_FILE down
        echo "✅ Development environment stopped!"
        ;;
    
    "restart")
        echo "🔄 Restarting Price Tracker development environment..."
        docker-compose -f $COMPOSE_FILE down
        docker-compose -f $COMPOSE_FILE up -d
        echo "✅ Development environment restarted!"
        ;;
    
    "shell")
        echo "🐚 Entering development container..."
        docker exec -it price-tracker-dev bash
        ;;
    
    "logs")
        echo "📋 Showing logs..."
        docker-compose -f $COMPOSE_FILE logs -f
        ;;
    
    "status")
        echo "📊 Container status:"
        docker-compose -f $COMPOSE_FILE ps
        ;;
    
    "clean")
        echo "🧹 Cleaning up development environment..."
        docker-compose -f $COMPOSE_FILE down -v
        docker system prune -f
        echo "✅ Cleanup completed!"
        ;;
    
    "create-backend")
        echo "🏗️ Creating NestJS backend..."
        docker exec -it price-tracker-dev bash -c "cd /workspace && nest new backend --package-manager npm"
        echo "✅ Backend created!"
        ;;
    
    "create-frontend")
        echo "🏗️ Creating Angular frontend..."
        docker exec -it price-tracker-dev bash -c "cd /workspace && ng new frontend --routing --style=scss --package-manager=npm"
        echo "✅ Frontend created!"
        ;;
    
    "install-backend")
        echo "📦 Installing backend dependencies..."
        docker exec -it price-tracker-dev bash -c "cd /workspace/backend && npm install"
        echo "✅ Backend dependencies installed!"
        ;;
    
    "install-frontend")
        echo "📦 Installing frontend dependencies..."
        docker exec -it price-tracker-dev bash -c "cd /workspace/frontend && npm install"
        echo "✅ Frontend dependencies installed!"
        ;;
    
    "dev-backend")
        echo "🚀 Starting backend development server..."
        docker exec -it price-tracker-dev bash -c "cd /workspace/backend && npm run start:dev"
        ;;
    
    "dev-frontend")
        echo "🚀 Starting frontend development server..."
        docker exec -it price-tracker-dev bash -c "cd /workspace/frontend && ng serve --host 0.0.0.0 --port 3000"
        ;;
    
    "test-db")
        echo "🔍 Testing database connection..."
        docker exec -it price-tracker-postgres psql -U devuser -d pricetracker_dev -c "SELECT version();"
        echo "✅ Database connection successful!"
        ;;
    
    "test-redis")
        echo "🔍 Testing Redis connection..."
        docker exec -it price-tracker-redis redis-cli ping
        echo "✅ Redis connection successful!"
        ;;
    
    "backup-db")
        echo "💾 Creating database backup..."
        timestamp=$(date +%Y%m%d_%H%M%S)
        docker exec -t price-tracker-postgres pg_dump -U devuser pricetracker_dev > "backup_${timestamp}.sql"
        echo "✅ Database backup created: backup_${timestamp}.sql"
        ;;
    
    "restore-db")
        if [ -z "$2" ]; then
            echo "❌ Usage: ./dev-scripts.sh restore-db backup_file.sql"
            exit 1
        fi
        echo "📥 Restoring database from $2..."
        docker exec -i price-tracker-postgres psql -U devuser pricetracker_dev < "$2"
        echo "✅ Database restored!"
        ;;
    
    "help"|*)
        echo "🔧 Price Tracker Development Scripts"
        echo ""
        echo "Available commands:"
        echo "  start           - Start development environment"
        echo "  stop            - Stop development environment"
        echo "  restart         - Restart development environment"
        echo "  shell           - Enter development container"
        echo "  logs            - Show container logs"
        echo "  status          - Show container status"
        echo "  clean           - Clean up containers and volumes"
        echo ""
        echo "Project setup:"
        echo "  create-backend  - Create NestJS backend project"
        echo "  create-frontend - Create Angular frontend project"
        echo "  install-backend - Install backend dependencies"
        echo "  install-frontend- Install frontend dependencies"
        echo ""
        echo "Development:"
        echo "  dev-backend     - Start backend development server"
        echo "  dev-frontend    - Start frontend development server"
        echo ""
        echo "Database:"
        echo "  test-db         - Test database connection"
        echo "  test-redis      - Test Redis connection"
        echo "  backup-db       - Create database backup"
        echo "  restore-db      - Restore database from backup"
        echo ""
        echo "Usage: ./dev-scripts.sh [command]"
        ;;
esac