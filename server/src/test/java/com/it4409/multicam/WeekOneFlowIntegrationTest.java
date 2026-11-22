package com.it4409.multicam;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:multicam-test;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.jwt.secret=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
        "app.bootstrap.controller-email=controller@test.local",
        "app.bootstrap.controller-password=test-controller-password",
        "app.bootstrap.remote-email=remote@test.local",
        "app.bootstrap.remote-password=test-remote-password"
})
class WeekOneFlowIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void controllerAndRemoteCompleteWeekOneRoomFlow() throws Exception {
        JsonNode unauthorized = objectMapper.readTree(mockMvc.perform(get("/rooms/rm_missing/members"))
                        .andExpect(status().isUnauthorized())
                        .andReturn()
                        .getResponse()
                        .getContentAsString());
        assertThat(unauthorized.path("code").asText()).isEqualTo("1009");

        String controllerDeviceId = UUID.randomUUID().toString();
        JsonNode controllerLogin = login(
                "controller@test.local",
                "test-controller-password",
                controllerDeviceId,
                4);
        assertThat(controllerLogin.path("data").path("account_role").asText()).isEqualTo("controller");

        JsonNode createdRoom = postJson(
                "/rooms",
                controllerLogin.path("data").path("access_token").asText(),
                """
                {"room_name":"Week one","max_members":8}
                """,
                200);
        String roomId = createdRoom.path("data").path("room_id").asText();
        String inviteCode = createdRoom.path("data").path("invite_code").asText();
        assertThat(inviteCode).matches("[A-Z0-9]{6}");

        String remoteDeviceId = UUID.randomUUID().toString();
        JsonNode remoteLogin = login(
                "remote@test.local",
                "test-remote-password",
                remoteDeviceId,
                1);
        assertThat(remoteLogin.path("data").path("account_role").asText()).isEqualTo("remote");

        JsonNode joinedRoom = postJson(
                "/rooms/join",
                remoteLogin.path("data").path("access_token").asText(),
                objectMapper.createObjectNode()
                        .put("invite_code", inviteCode)
                        .put("device_id", remoteDeviceId)
                        .put("camera_name", "Android Remote")
                        .put("grant_control", true)
                        .toString(),
                200);
        assertThat(joinedRoom.path("data").path("room_id").asText()).isEqualTo(roomId);
        assertThat(joinedRoom.path("data").path("members").size()).isEqualTo(1);

        JsonNode members = objectMapper.readTree(mockMvc.perform(get("/rooms/{room_id}/members", roomId)
                        .header("Authorization", bearer(controllerLogin)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString());
        assertThat(members.path("data").get(0).path("camera_name").asText()).isEqualTo("Android Remote");

        JsonNode forbidden = objectMapper.readTree(mockMvc.perform(post("/rooms")
                        .header("Authorization", bearer(remoteLogin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden())
                .andReturn()
                .getResponse()
                .getContentAsString());
        assertThat(forbidden.path("code").asText()).isEqualTo("1009");
    }

    private JsonNode login(String email, String password, String deviceId, int deviceType) throws Exception {
        String body = objectMapper.createObjectNode()
                .put("email", email)
                .put("password", password)
                .put("device_id", deviceId)
                .put("device_type", deviceType)
                .put("device_name", deviceType == 4 ? "Web Controller" : "Android Remote")
                .toString();
        MvcResult result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private JsonNode postJson(String path, String token, String body, int expectedStatus) throws Exception {
        MvcResult result = mockMvc.perform(post(path)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().is(expectedStatus))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private String bearer(JsonNode loginResponse) {
        return bearer(loginResponse.path("data").path("access_token").asText());
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
