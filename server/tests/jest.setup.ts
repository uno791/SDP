process.env.NODE_ENV = "test";

jest.mock("../supabaseClient", () => require("./__mocks__/supabaseClient"));
