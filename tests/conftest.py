import copy
import pytest
from fastapi.testclient import TestClient

import src.app as app_module


# Snapshot initial activities to restore between tests
INITIAL_ACTIVITIES = copy.deepcopy(app_module.activities)


@pytest.fixture
def client():
    # Arrange: reset in-memory activities to initial state before each test
    app_module.activities = copy.deepcopy(INITIAL_ACTIVITIES)

    # Provide a TestClient for the FastAPI app
    with TestClient(app_module.app) as c:
        yield c
