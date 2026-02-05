import logging
from database import init_db

if __name__ == "__main__":
    logging.info("Iniciando DB do CodeQuest...")
    init_db()
    logging.info("DB do CodeQuest iniciada com sucesso!")
