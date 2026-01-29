#!/bin/bash

# Super Rich Monopoly Money - Docker Helper Script

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Super Rich Monopoly Money - Docker Manager    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}Error: Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi
}

# Function to display menu
show_menu() {
    echo "What would you like to do?"
    echo ""
    echo "1) 🚀 Start the application"
    echo "2) 🛑 Stop the application"
    echo "3) 🔄 Rebuild and restart"
    echo "4) 📊 View logs"
    echo "5) 🧹 Clean up (remove containers and images)"
    echo "6) ℹ️  Show container status"
    echo "7) 🚪 Exit"
    echo ""
    read -p "Enter your choice [1-7]: " choice
}

# Function to start the application
start_app() {
    echo -e "${BLUE}Starting Super Rich Monopoly Money...${NC}"
    docker-compose up -d
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Application started successfully!${NC}"
        echo -e "${GREEN}🌐 Open http://localhost:3000 in your browser${NC}"
    else
        echo -e "${RED}✗ Failed to start application${NC}"
    fi
}

# Function to stop the application
stop_app() {
    echo -e "${BLUE}Stopping application...${NC}"
    docker-compose down
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Application stopped${NC}"
    else
        echo -e "${RED}✗ Failed to stop application${NC}"
    fi
}

# Function to rebuild and restart
rebuild_app() {
    echo -e "${BLUE}Rebuilding and restarting application...${NC}"
    docker-compose down
    docker-compose up -d --build
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Application rebuilt and started!${NC}"
        echo -e "${GREEN}🌐 Open http://localhost:3000 in your browser${NC}"
    else
        echo -e "${RED}✗ Failed to rebuild application${NC}"
    fi
}

# Function to view logs
view_logs() {
    echo -e "${BLUE}Viewing logs (Press Ctrl+C to exit)...${NC}"
    docker-compose logs -f
}

# Function to clean up
cleanup() {
    echo -e "${BLUE}Cleaning up Docker containers and images...${NC}"
    read -p "Are you sure? This will remove all containers and images. (y/N): " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        docker-compose down
        docker rmi super-rich-monopoly 2>/dev/null || true
        echo -e "${GREEN}✓ Cleanup complete${NC}"
    else
        echo "Cleanup cancelled"
    fi
}

# Function to show status
show_status() {
    echo -e "${BLUE}Container Status:${NC}"
    docker-compose ps
    echo ""
    echo -e "${BLUE}Docker Images:${NC}"
    docker images | grep super-rich || echo "No super-rich images found"
}

# Main script
check_docker

while true; do
    echo ""
    show_menu
    
    case $choice in
        1)
            start_app
            ;;
        2)
            stop_app
            ;;
        3)
            rebuild_app
            ;;
        4)
            view_logs
            ;;
        5)
            cleanup
            ;;
        6)
            show_status
            ;;
        7)
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option. Please choose 1-7.${NC}"
            ;;
    esac
done
